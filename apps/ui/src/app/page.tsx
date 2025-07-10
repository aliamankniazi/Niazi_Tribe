'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  GlobeAmericasIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Interactive Family Tree',
    description: 'Build and navigate your family tree with our intuitive drag-and-drop interface. Zoom, pan, and explore generations of your ancestry.',
    icon: ChartBarIcon,
    color: 'text-blue-600',
  },
  {
    name: 'Collaborative Research',
    description: 'Work together with family members and researchers worldwide to build a comprehensive family history.',
    icon: UsersIcon,
    color: 'text-green-600',
  },
  {
    name: 'GEDCOM Support',
    description: 'Import and export your family data using the standard GEDCOM format. Compatible with all major genealogy software.',
    icon: DocumentTextIcon,
    color: 'text-purple-600',
  },
  {
    name: 'Global Database',
    description: 'Access millions of historical records and connect your family to the global family tree.',
    icon: GlobeAmericasIcon,
    color: 'text-indigo-600',
  },
  {
    name: 'DNA Integration',
    description: 'Upload your DNA data to discover genetic matches and verify family connections with scientific accuracy.',
    icon: BeakerIcon,
    color: 'text-red-600',
  },
  {
    name: 'Smart Matching',
    description: 'Our AI-powered matching system automatically suggests potential family connections and duplicate records.',
    icon: MagnifyingGlassIcon,
    color: 'text-yellow-600',
  },
];

const stats = [
  { id: 1, name: 'People in the tree', value: '2.5M+' },
  { id: 2, name: 'Active researchers', value: '150K+' },
  { id: 3, name: 'DNA profiles', value: '50K+' },
  { id: 4, name: 'Historical records', value: '10M+' },
];

export default function HomePage() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">Niazi Tribe</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/features" className="nav-link">Features</Link>
              <Link href="/discover" className="nav-link">Discover</Link>
              <Link href="/dna" className="nav-link">DNA</Link>
              <Link href="/help" className="nav-link">Help</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="nav-link">Sign In</Link>
              <Link href="/register" className="btn btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                Discover your 
                <span className="text-gradient"> family story</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl">
                Join millions of people collaborating to build the world's largest family tree. 
                Explore your ancestry, connect with relatives, and uncover your family's unique history.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="btn btn-primary btn-lg">
                  Start Your Tree Free
                </Link>
                <button 
                  onClick={() => setVideoLoaded(true)}
                  className="btn btn-outline btn-lg group"
                >
                  <PlayIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Free to start • No credit card required • 14-day premium trial
              </p>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transform rotate-3"></div>
                <div className="relative bg-white rounded-lg shadow-xl p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Family Tree</h3>
                    <div className="space-y-4">
                      {/* Simple tree visualization */}
                      <div className="flex justify-center">
                        <div className="tree-node tree-node-male text-center">
                          <div className="text-sm font-medium">John Smith</div>
                          <div className="text-xs text-gray-500">1920-1995</div>
                        </div>
                      </div>
                      <div className="flex justify-center space-x-8">
                        <div className="tree-node tree-node-female text-center">
                          <div className="text-sm font-medium">Mary Johnson</div>
                          <div className="text-xs text-gray-500">1895-1975</div>
                        </div>
                        <div className="tree-node tree-node-male text-center">
                          <div className="text-sm font-medium">Robert Smith</div>
                          <div className="text-xs text-gray-500">1890-1970</div>
                        </div>
                      </div>
                      <div className="text-center text-sm text-gray-600">
                        + 247 more relatives discovered
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <dt className="text-base font-medium text-primary-100">{stat.name}</dt>
                <dd className="text-3xl font-bold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need for family research
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful tools and features designed to help you build, explore, and share your family history.
            </p>
          </div>
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="card-body">
                  <div className="flex items-center">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.name}</h3>
                  </div>
                  <p className="mt-4 text-gray-600">{feature.description}</p>
                  <div className="mt-6">
                    <a href="#" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                      Learn more
                      <ChevronRightIcon className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to discover your family story?
            </h2>
            <p className="mt-4 text-xl text-primary-100">
              Join millions of people building the world's family tree together.
            </p>
            <div className="mt-8">
              <Link href="/register" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50">
                Start Building Your Tree
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link href="/dna" className="text-gray-400 hover:text-white">DNA</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Support</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/community" className="text-gray-400 hover:text-white">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="text-gray-400 hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8">
            <p className="text-gray-400 text-center">
              © 2024 Niazi Tribe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 