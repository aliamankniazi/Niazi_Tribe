const neo4j = require('neo4j-driver');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'consistency-check.log' })
  ]
});

class ConsistencyChecker {
  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
      )
    );
  }

  async runChecks() {
    logger.info('Starting consistency checks...');
    
    try {
      await this.checkDateConsistency();
      await this.checkRelationshipConsistency();
      await this.checkDuplicateNames();
      await this.checkOrphanedRecords();
      
      logger.info('Consistency checks completed successfully');
    } catch (error) {
      logger.error('Consistency check failed:', error);
      throw error;
    }
  }

  async checkDateConsistency() {
    const session = this.driver.session();
    
    try {
      // Check for people with birth dates after death dates
      const result = await session.run(`
        MATCH (p:Person)
        WHERE p.birthDate IS NOT NULL 
          AND p.deathDate IS NOT NULL
          AND date(p.birthDate) > date(p.deathDate)
        RETURN p.id as personId, p.birthDate, p.deathDate
      `);

      if (result.records.length > 0) {
        logger.warn(`Found ${result.records.length} people with birth dates after death dates`);
        
        for (const record of result.records) {
          const personId = record.get('personId');
          const birthDate = record.get('birthDate');
          const deathDate = record.get('deathDate');
          
          logger.warn(`Person ${personId}: birth ${birthDate} > death ${deathDate}`);
          
          // Flag this for review
          await session.run(`
            MATCH (p:Person {id: $personId})
            SET p.hasDateIssue = true,
                p.dateIssueDescription = 'Birth date is after death date'
          `, { personId });
        }
      }

      // Check for children born before parents
      const parentChildResult = await session.run(`
        MATCH (parent:Person)-[:PARENT_OF]->(child:Person)
        WHERE parent.birthDate IS NOT NULL 
          AND child.birthDate IS NOT NULL
          AND date(child.birthDate) < date(parent.birthDate) + duration('P15Y')
        RETURN parent.id as parentId, child.id as childId,
               parent.birthDate as parentBirth, child.birthDate as childBirth
      `);

      if (parentChildResult.records.length > 0) {
        logger.warn(`Found ${parentChildResult.records.length} parent-child date inconsistencies`);
      }

    } finally {
      await session.close();
    }
  }

  async checkRelationshipConsistency() {
    const session = this.driver.session();
    
    try {
      // Check for impossible relationships (e.g., person is their own ancestor)
      const result = await session.run(`
        MATCH path = (p:Person)-[:PARENT_OF*]->(p)
        RETURN p.id as personId, length(path) as pathLength
      `);

      if (result.records.length > 0) {
        logger.error(`Found ${result.records.length} circular family relationships!`);
        
        for (const record of result.records) {
          const personId = record.get('personId');
          const pathLength = record.get('pathLength');
          
          logger.error(`Person ${personId} is their own ancestor (path length: ${pathLength})`);
        }
      }

      // Check for duplicate spouse relationships
      const spouseResult = await session.run(`
        MATCH (p1:Person)-[r1:SPOUSE_OF]->(p2:Person),
              (p1)-[r2:SPOUSE_OF]->(p2)
        WHERE id(r1) <> id(r2)
        RETURN p1.id as person1Id, p2.id as person2Id, count(*) as duplicateCount
      `);

      if (spouseResult.records.length > 0) {
        logger.warn(`Found ${spouseResult.records.length} duplicate spouse relationships`);
      }

    } finally {
      await session.close();
    }
  }

  async checkDuplicateNames() {
    const session = this.driver.session();
    
    try {
      // Find people with identical names and similar birth dates
      const result = await session.run(`
        MATCH (p1:Person), (p2:Person)
        WHERE p1.id <> p2.id
          AND p1.firstName = p2.firstName
          AND p1.lastName = p2.lastName
          AND abs(duration.between(date(p1.birthDate), date(p2.birthDate)).years) < 5
        RETURN p1.id as person1Id, p2.id as person2Id,
               p1.firstName + ' ' + p1.lastName as name,
               p1.birthDate as birth1, p2.birthDate as birth2
        LIMIT 100
      `);

      if (result.records.length > 0) {
        logger.info(`Found ${result.records.length} potential duplicate people`);
        
        // Create potential match relationships
        for (const record of result.records) {
          const person1Id = record.get('person1Id');
          const person2Id = record.get('person2Id');
          
          await session.run(`
            MATCH (p1:Person {id: $person1Id}), (p2:Person {id: $person2Id})
            MERGE (p1)-[m:POTENTIAL_DUPLICATE]->(p2)
            SET m.confidence = 0.8,
                m.reason = 'Similar name and birth date',
                m.detectedAt = datetime()
          `, { person1Id, person2Id });
        }
      }

    } finally {
      await session.close();
    }
  }

  async checkOrphanedRecords() {
    const session = this.driver.session();
    
    try {
      // Find media not linked to any person
      const mediaResult = await session.run(`
        MATCH (m:Media)
        WHERE NOT (m)<-[:HAS_MEDIA]-(:Person)
        RETURN count(m) as orphanedMediaCount
      `);

      const orphanedMediaCount = mediaResult.records[0].get('orphanedMediaCount').toNumber();
      if (orphanedMediaCount > 0) {
        logger.warn(`Found ${orphanedMediaCount} orphaned media records`);
      }

      // Find sources not linked to any person or event
      const sourceResult = await session.run(`
        MATCH (s:Source)
        WHERE NOT (s)<-[:HAS_SOURCE]-(:Person)
          AND NOT (s)<-[:HAS_SOURCE]-(:LifeEvent)
        RETURN count(s) as orphanedSourceCount
      `);

      const orphanedSourceCount = sourceResult.records[0].get('orphanedSourceCount').toNumber();
      if (orphanedSourceCount > 0) {
        logger.warn(`Found ${orphanedSourceCount} orphaned source records`);
      }

    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }
}

// Run the consistency check
async function main() {
  const checker = new ConsistencyChecker();
  
  try {
    await checker.runChecks();
  } catch (error) {
    logger.error('Consistency check failed:', error);
    process.exit(1);
  } finally {
    await checker.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ConsistencyChecker }; 