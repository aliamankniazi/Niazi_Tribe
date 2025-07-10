const amqp = require('amqplib');
const neo4j = require('neo4j-driver');
const { createClient } = require('redis');
const winston = require('winston');
const { SmartMatcher } = require('./matcher');
const { config } = require('./config');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'matching-service.log' })
  ]
});

class MatchingService {
  constructor() {
    this.rabbitConnection = null;
    this.neo4jDriver = neo4j.driver(
      config.NEO4J_URI,
      neo4j.auth.basic(config.NEO4J_USERNAME, config.NEO4J_PASSWORD)
    );
    
    this.redisClient = createClient({ url: config.REDIS_URL });
    this.matcher = new SmartMatcher(this.neo4jDriver, this.redisClient);
  }

  async start() {
    try {
      // Connect to Redis
      await this.redisClient.connect();
      logger.info('Connected to Redis');

      // Connect to RabbitMQ
      this.rabbitConnection = await amqp.connect(config.RABBITMQ_URL);
      const channel = await this.rabbitConnection.createChannel();

      // Declare queues
      await channel.assertQueue('person.created', { durable: true });
      await channel.assertQueue('person.updated', { durable: true });
      await channel.assertQueue('matching.process', { durable: true });
      await channel.assertQueue('matching.results', { durable: true });

      // Set up consumers
      await this.setupConsumers(channel);

      logger.info('Matching service started successfully');
    } catch (error) {
      logger.error('Failed to start matching service:', error);
      process.exit(1);
    }
  }

  async setupConsumers(channel) {
    // Listen for new person creation
    channel.consume('person.created', async (msg) => {
      if (msg) {
        try {
          const personData = JSON.parse(msg.content.toString());
          logger.info(`Processing new person: ${personData.id}`);
          
          await this.processPerson(personData);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing person.created:', error);
          channel.nack(msg, false, false);
        }
      }
    });

    // Listen for person updates
    channel.consume('person.updated', async (msg) => {
      if (msg) {
        try {
          const personData = JSON.parse(msg.content.toString());
          logger.info(`Processing updated person: ${personData.id}`);
          
          await this.processPerson(personData);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing person.updated:', error);
          channel.nack(msg, false, false);
        }
      }
    });

    // Listen for explicit matching requests
    channel.consume('matching.process', async (msg) => {
      if (msg) {
        try {
          const request = JSON.parse(msg.content.toString());
          logger.info(`Processing matching request: ${request.personId}`);
          
          await this.processMatchingRequest(request);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing matching request:', error);
          channel.nack(msg, false, false);
        }
      }
    });
  }

  async processPerson(personData) {
    try {
      // Find potential matches for this person
      const matches = await this.matcher.findMatches(personData);
      
      if (matches.length > 0) {
        logger.info(`Found ${matches.length} potential matches for person ${personData.id}`);
        
        // Store matches in database
        await this.storeMatches(personData.id, matches);
        
        // Notify the main application
        await this.notifyMatches(personData.id, matches);
      }
    } catch (error) {
      logger.error(`Error processing person ${personData.id}:`, error);
      throw error;
    }
  }

  async processMatchingRequest(request) {
    try {
      const { personId, targetPersonId, userId } = request;
      
      if (targetPersonId) {
        // Compare specific persons
        const match = await this.matcher.comparePeople(personId, targetPersonId);
        await this.notifySpecificMatch(userId, match);
      } else {
        // Find all matches for a person
        const session = this.neo4jDriver.session();
        try {
          const result = await session.run(
            'MATCH (p:Person {id: $personId}) RETURN p',
            { personId }
          );
          
          if (result.records.length > 0) {
            const personData = result.records[0].get('p').properties;
            await this.processPerson(personData);
          }
        } finally {
          await session.close();
        }
      }
    } catch (error) {
      logger.error('Error processing matching request:', error);
      throw error;
    }
  }

  async storeMatches(personId, matches) {
    const session = this.neo4jDriver.session();
    
    try {
      for (const match of matches) {
        await session.run(`
          MATCH (p1:Person {id: $person1Id}), (p2:Person {id: $person2Id})
          MERGE (p1)-[m:POTENTIAL_MATCH]->(p2)
          SET m.confidence = $confidence,
              m.reasons = $reasons,
              m.status = 'pending',
              m.createdAt = datetime()
        `, {
          person1Id: personId,
          person2Id: match.personId,
          confidence: match.confidence,
          reasons: JSON.stringify(match.reasons)
        });
      }
    } finally {
      await session.close();
    }
  }

  async notifyMatches(personId, matches) {
    if (!this.rabbitConnection) return;
    
    const channel = await this.rabbitConnection.createChannel();
    
    const notification = {
      type: 'smart_matches_found',
      personId,
      matches: matches.map(m => ({
        personId: m.personId,
        confidence: m.confidence,
        reasons: m.reasons
      })),
      timestamp: new Date().toISOString()
    };
    
    channel.sendToQueue(
      'matching.results',
      Buffer.from(JSON.stringify(notification)),
      { persistent: true }
    );
    
    await channel.close();
  }

  async notifySpecificMatch(userId, match) {
    if (!this.rabbitConnection) return;
    
    const channel = await this.rabbitConnection.createChannel();
    
    const notification = {
      type: 'match_comparison_result',
      userId,
      match,
      timestamp: new Date().toISOString()
    };
    
    channel.sendToQueue(
      'matching.results',
      Buffer.from(JSON.stringify(notification)),
      { persistent: true }
    );
    
    await channel.close();
  }

  async stop() {
    if (this.rabbitConnection) {
      await this.rabbitConnection.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    await this.neo4jDriver.close();
  }
}

// Start the service
const service = new MatchingService();

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await service.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await service.stop();
  process.exit(0);
});

service.start().catch(error => {
  logger.error('Failed to start service:', error);
  process.exit(1);
}); 