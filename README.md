# Niazi Tribe - Collaborative World Family-Tree Platform

A modern, scalable genealogy platform that enables users to collaboratively build a unified world family tree with advanced features like smart matching, DNA integration, and GEDCOM import/export.

## 🏗️ Architecture

This is a monorepo containing:

- **`apps/api`** - Node.js/Express REST API with GraphQL endpoints
- **`apps/ui`** - Next.js React frontend with TypeScript
- **`packages/shared`** - Shared types, utilities, and validation schemas
- **`services/`** - Microservices for matching, GEDCOM processing, DNA analysis
- **`jobs/`** - Background job processors and cron tasks

## 🚀 Features

### Core Features
- ✅ Multi-tenant user authentication with role-based access
- ✅ Interactive family tree visualization with infinite zoom/pan
- ✅ Person profiles with rich biographical data
- ✅ Relationship management (parents, children, spouses, adoptions)
- ✅ Media management with S3-backed storage
- ✅ Smart matching and duplicate detection
- ✅ GEDCOM import/export (v5.5 compliance)
- ✅ DNA data integration and analysis
- ✅ Discussion forums and collaborative projects
- ✅ Advanced search and filtering
- ✅ Automated consistency checks

### Technical Features
- 🔐 JWT-based authentication with email verification
- 📊 Graph database optimization (Neo4j/Neptune ready)
- 🎨 Modern React UI with TypeScript
- 🚀 Microservices architecture
- 🐳 Docker containerization
- 🧪 Comprehensive testing suite
- 📚 OpenAPI documentation

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Neo4j (or compatible graph database)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd niazi-tribe
   npm run setup
   ```

2. **Start services**
   ```bash
   # Start database and external services
   npm run docker:up
   
   # Start development servers
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:4000
   - API Docs: http://localhost:4000/docs

## 📁 Project Structure

```
niazi-tribe/
├── apps/
│   ├── api/                 # Express API server
│   └── ui/                  # Next.js frontend
├── packages/
│   └── shared/              # Shared utilities and types
├── services/
│   ├── matching/            # Smart matching service
│   ├── gedcom/              # GEDCOM import/export
│   ├── dna/                 # DNA processing
│   └── notifications/       # Email and push notifications
├── jobs/
│   ├── consistency-check/   # Data validation jobs
│   └── background-tasks/    # Async processing
├── docs/                    # Documentation and diagrams
├── docker-compose.yml       # Development environment
└── kubernetes/              # Production deployment configs
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 📊 Database Schema

The platform uses a graph database approach optimized for genealogical relationships:

- **Nodes**: Person, Media, Source, Project, Discussion
- **Relationships**: PARENT_OF, SPOUSE_OF, SIBLING_OF, ADOPTED_BY
- **Properties**: Temporal data, privacy settings, verification status

## 🚀 Deployment

### Development
```bash
npm run docker:up
npm run dev
```

### Production
```bash
npm run build
npm run docker:build
# Deploy to Kubernetes
kubectl apply -f kubernetes/
```

## 📖 API Documentation

- REST API: `/docs` (Swagger UI)
- GraphQL Playground: `/graphql`
- Database Schema: `/docs/schema`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 