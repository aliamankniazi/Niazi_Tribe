const config = {
  NEO4J_URI: process.env.NEO4J_URI || 'bolt://neo4j:7687',
  NEO4J_USERNAME: process.env.NEO4J_USERNAME || 'neo4j',
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || 'password',
  REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://niazi:niazi_password@rabbitmq:5672'
};

module.exports = { config }; 