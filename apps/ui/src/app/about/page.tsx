export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">About Niazi-Tribe</h1>
      
      <div className="prose lg:prose-xl max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-4">
            Niazi-Tribe is dedicated to helping people discover, preserve, and share their family history.
            We believe that understanding our roots helps us better understand ourselves and connects us
            with our shared human story.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Build and explore your family tree</li>
            <li>Connect with relatives and collaborate on family research</li>
            <li>Preserve family photos and documents</li>
            <li>Discover your family story through historical records</li>
            <li>Share your discoveries with family members</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Create Your Tree</h3>
              <p className="text-gray-600">
                Start by adding yourself and your immediate family members to begin building your family tree.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Connect with Others</h3>
              <p className="text-gray-600">
                Find and connect with relatives who are also researching your family history.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Discover More</h3>
              <p className="text-gray-600">
                Use our research tools to discover historical records and expand your family tree.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-600">
            Have questions or need help? Contact our support team at{' '}
            <a href="mailto:support@niazitribe.com" className="text-blue-500 hover:text-blue-600">
              support@niazitribe.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
} 