export interface Subtopic {
  name: string;
  description: string;
  weight: number;
}

export interface AZ900Topic {
  name: string;
  domain: string;
  weight: number;
  icon: string;
  subtopics: Subtopic[];
}

export const AZ900_TOPICS: AZ900Topic[] = [
  {
    name: 'Cloud Concepts',
    domain: 'Domain 1',
    weight: 25,
    icon: 'Cloud',
    subtopics: [
      { name: 'What is Cloud Computing', description: 'Understand cloud models (IaaS, PaaS, SaaS) and their characteristics', weight: 1.5 },
      { name: 'Benefits of Cloud Computing', description: 'Cost savings, scalability, reliability, and agility benefits', weight: 1.5 },
      { name: 'Cloud Service Types', description: 'Compare IaaS, PaaS, and SaaS with real-world examples', weight: 1.5 },
      { name: 'Cloud Deployment Models', description: 'Public, private, and hybrid cloud models', weight: 1.5 },
      { name: 'Consumption-Based Model', description: 'Understand pay-as-you-go pricing and CapEx vs OpEx', weight: 1 },
    ],
  },
  {
    name: 'Azure Architecture & Services',
    domain: 'Domain 2',
    weight: 35,
    icon: 'Server',
    subtopics: [
      { name: 'Core Azure Resources', description: 'Compute, networking, storage, and databases in Azure', weight: 1.5 },
      { name: 'Azure Compute Services', description: 'VMs, App Services, AKS, Azure Functions, and Container Instances', weight: 2 },
      { name: 'Azure Networking', description: 'VNets, subnets, load balancers, VPN Gateway, and ExpressRoute', weight: 2 },
      { name: 'Azure Storage Services', description: 'Blob, Disk, File, and Archive storage tiers', weight: 2 },
      { name: 'Azure Identity & Governance', description: 'Microsoft Entra ID, RBAC, resource groups, and subscriptions', weight: 2 },
      { name: 'Cost Management & SLAs', description: 'Azure Cost Management, pricing calculator, and SLAs', weight: 1.5 },
    ],
  },
  {
    name: 'Azure Management & Governance',
    domain: 'Domain 3',
    weight: 20,
    icon: 'Settings',
    subtopics: [
      { name: 'Cost Management', description: 'Azure Pricing Calculator, TCO Calculator, and Cost Management tool', weight: 1.5 },
      { name: 'Service Level Agreements', description: 'Understand SLAs and how they impact application design', weight: 1.5 },
      { name: 'Azure Service Health', description: 'Service Health, Resource Health, and Azure Monitor', weight: 1.5 },
      { name: 'Azure Advisor & Resource Graph', description: 'Use Advisor recommendations and Resource Graph queries', weight: 1 },
      { name: 'Azure Policy & Blueprints', description: 'Enforce governance with Azure Policy and Blueprints', weight: 1.5 },
    ],
  },
  {
    name: 'Security, Privacy & Compliance',
    domain: 'Domain 4',
    weight: 20,
    icon: 'ShieldCheck',
    subtopics: [
      { name: 'Azure Security Center', description: 'Microsoft Defender for Cloud and security recommendations', weight: 1.5 },
      { name: 'Microsoft Entra ID', description: 'Authentication, MFA, conditional access, and identity protection', weight: 2 },
      { name: 'Network Security', description: 'NSGs, Azure Firewall, Application Gateway, and DDoS protection', weight: 2 },
      { name: 'Data Protection', description: 'Encryption at rest, in transit, and Azure Key Vault', weight: 1.5 },
      { name: 'Azure Compliance', description: 'Compliance offerings, privacy, and data residency', weight: 1.5 },
    ],
  },
];

export const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'New to this topic, need thorough study', weight: 3 },
  { value: 'intermediate', label: 'Intermediate', description: 'Some familiarity, need to reinforce', weight: 2 },
  { value: 'advanced', label: 'Advanced', description: 'Comfortable, just need a quick review', weight: 1 },
] as const;
