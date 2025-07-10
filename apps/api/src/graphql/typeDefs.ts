import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Query {
    hello: String
    person(id: ID!): Person
    persons: [Person]
  }

  type Mutation {
    createPerson(input: PersonInput!): Person
    updatePerson(id: ID!, input: PersonInput!): Person
  }

  type Person {
    id: ID!
    firstName: String
    lastName: String
    birthDate: String
    birthPlace: String
    gender: String
    createdAt: String
    updatedAt: String
  }

  input PersonInput {
    firstName: String
    lastName: String
    birthDate: String
    birthPlace: String
    gender: String
  }
`; 