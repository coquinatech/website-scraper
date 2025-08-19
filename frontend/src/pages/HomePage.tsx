export function HomePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to the Coding Agent Optimized Template
        </h1>
        <p className="text-gray-600 mb-6">
          A production-ready development template with comprehensive DevOps tooling, 
          observability, and best practices built-in.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard 
            title="Observability Stack"
            description="Grafana, Loki, Tempo, and Prometheus pre-configured"
            icon="📊"
          />
          <FeatureCard 
            title="Development Environment"
            description="DevContainer with all tools pre-installed"
            icon="🛠️"
          />
          <FeatureCard 
            title="TypeScript + React"
            description="Modern stack with hot-reload and strict typing"
            icon="⚛️"
          />
          <FeatureCard 
            title="API Documentation"
            description="Swagger UI automatically generated"
            icon="📚"
          />
          <FeatureCard 
            title="Database Ready"
            description="PostgreSQL with migrations and ORM"
            icon="🗄️"
          />
          <FeatureCard 
            title="Testing Infrastructure"
            description="Vitest and MSW for comprehensive testing"
            icon="✅"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="space-y-2">
          <QuickLink href="http://grafana:3000" label="Grafana Dashboard" />
          <QuickLink href="/documentation" label="API Documentation" />
          <QuickLink href="http://localhost:4983" label="Database Studio" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-blue-600 hover:text-blue-800 hover:underline"
    >
      {label} →
    </a>
  );
}