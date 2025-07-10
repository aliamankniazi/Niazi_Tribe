class SmartMatcher {
  constructor(neo4jDriver, redisClient) {
    this.neo4jDriver = neo4jDriver;
    this.redisClient = redisClient;
  }

  async findMatches(person) {
    const session = this.neo4jDriver.session();
    try {
      // Find potential matches based on name similarity and other attributes
      const result = await session.run(`
        MATCH (p:Person)
        WHERE p.id <> $personId
          AND (
            apoc.text.levenshteinSimilarity(p.firstName, $firstName) > 0.8
            OR apoc.text.levenshteinSimilarity(p.lastName, $lastName) > 0.8
          )
          AND abs(duration.between(date(p.birthDate), date($birthDate)).years) < 2
        RETURN p,
          apoc.text.levenshteinSimilarity(p.firstName, $firstName) as firstNameSim,
          apoc.text.levenshteinSimilarity(p.lastName, $lastName) as lastNameSim
        ORDER BY firstNameSim + lastNameSim DESC
        LIMIT 10
      `, {
        personId: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        birthDate: person.birthDate
      });

      return result.records.map(record => {
        const matchPerson = record.get('p').properties;
        const firstNameSim = record.get('firstNameSim');
        const lastNameSim = record.get('lastNameSim');
        
        const confidence = (firstNameSim + lastNameSim) / 2;
        const reasons = [];

        if (firstNameSim > 0.8) {
          reasons.push('Similar first name');
        }
        if (lastNameSim > 0.8) {
          reasons.push('Similar last name');
        }
        if (person.birthDate === matchPerson.birthDate) {
          reasons.push('Exact birth date match');
        }

        return {
          personId: matchPerson.id,
          confidence,
          reasons
        };
      });
    } finally {
      await session.close();
    }
  }

  async comparePeople(person1Id, person2Id) {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(`
        MATCH (p1:Person {id: $person1Id}), (p2:Person {id: $person2Id})
        RETURN p1, p2
      `, { person1Id, person2Id });

      if (result.records.length === 0) {
        return null;
      }

      const person1 = result.records[0].get('p1').properties;
      const person2 = result.records[0].get('p2').properties;

      const firstNameSim = this.calculateSimilarity(person1.firstName, person2.firstName);
      const lastNameSim = this.calculateSimilarity(person1.lastName, person2.lastName);
      const birthDateMatch = person1.birthDate === person2.birthDate;

      const confidence = (firstNameSim + lastNameSim) / 2;
      const reasons = [];

      if (firstNameSim > 0.8) {
        reasons.push('Similar first name');
      }
      if (lastNameSim > 0.8) {
        reasons.push('Similar last name');
      }
      if (birthDateMatch) {
        reasons.push('Exact birth date match');
      }

      return {
        person1Id,
        person2Id,
        confidence,
        reasons,
        details: {
          firstNameSimilarity: firstNameSim,
          lastNameSimilarity: lastNameSim,
          birthDateMatch
        }
      };
    } finally {
      await session.close();
    }
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    
    if (str1 === str2) return 1;
    
    const len1 = str1.length;
    const len2 = str2.length;
    const maxDist = Math.floor(Math.max(len1, len2) / 2) - 1;
    let matches = 0;
    let transpositions = 0;
    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);

    // Find matching characters
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - maxDist);
      const end = Math.min(i + maxDist + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (!str2Matches[j] && str1[i] === str2[j]) {
          str1Matches[i] = true;
          str2Matches[j] = true;
          matches++;
          break;
        }
      }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (str1Matches[i]) {
        while (!str2Matches[k]) k++;
        if (str1[i] !== str2[k]) transpositions++;
        k++;
      }
    }

    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  }
}

module.exports = { SmartMatcher }; 