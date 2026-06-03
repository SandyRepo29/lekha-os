/**
 * Built-in compliance framework templates with standard controls.
 * Used by the seed script and the "Add Framework" wizard to auto-populate controls.
 */

export type ControlTemplate = {
  controlRef: string;
  name: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
};

export type FrameworkTemplate = {
  key: string;
  name: string;
  version: string;
  description: string;
  controls: ControlTemplate[];
};

/* ================================================================
   ISO 27001:2022  — 93 controls across 4 sections
   ================================================================ */

const ISO27001_CONTROLS: ControlTemplate[] = [
  // A.5 Organisational controls
  { controlRef: "A.5.1",  name: "Policies for information security",                              description: "Define, approve and publish information security policies.",                                               category: "Organisational", priority: "high"     },
  { controlRef: "A.5.2",  name: "Information security roles and responsibilities",                description: "Assign and communicate information security roles and responsibilities.",                                  category: "Organisational", priority: "high"     },
  { controlRef: "A.5.3",  name: "Segregation of duties",                                         description: "Separate conflicting duties and areas of responsibility to reduce fraud risk.",                            category: "Organisational", priority: "high"     },
  { controlRef: "A.5.4",  name: "Management responsibilities",                                   description: "Management must require all personnel to apply information security per policy.",                          category: "Organisational", priority: "medium"   },
  { controlRef: "A.5.5",  name: "Contact with authorities",                                      description: "Maintain appropriate contacts with relevant authorities.",                                                  category: "Organisational", priority: "low"      },
  { controlRef: "A.5.6",  name: "Contact with special interest groups",                          description: "Maintain contacts with special interest groups or security forums.",                                        category: "Organisational", priority: "low"      },
  { controlRef: "A.5.7",  name: "Threat intelligence",                                           description: "Collect and analyse information about information security threats.",                                       category: "Organisational", priority: "high"     },
  { controlRef: "A.5.8",  name: "Information security in project management",                    description: "Integrate information security into project management.",                                                   category: "Organisational", priority: "medium"   },
  { controlRef: "A.5.9",  name: "Inventory of information and other associated assets",          description: "Identify and maintain an inventory of information and associated assets.",                                  category: "Organisational", priority: "medium"   },
  { controlRef: "A.5.10", name: "Acceptable use of information and other associated assets",     description: "Define and implement rules for acceptable use of information assets.",                                      category: "Organisational", priority: "medium"   },
  { controlRef: "A.5.11", name: "Return of assets",                                              description: "Ensure personnel return assets upon termination.",                                                          category: "Organisational", priority: "medium"   },
  { controlRef: "A.5.12", name: "Classification of information",                                 description: "Classify information according to security requirements.",                                                  category: "Organisational", priority: "high"     },
  { controlRef: "A.5.13", name: "Labelling of information",                                      description: "Develop and implement procedures for information labelling.",                                               category: "Organisational", priority: "medium"   },
  { controlRef: "A.5.14", name: "Information transfer",                                          description: "Maintain rules, procedures and agreements for information transfer.",                                       category: "Organisational", priority: "high"     },
  { controlRef: "A.5.15", name: "Access control",                                                description: "Establish and implement access control policy based on business requirements.",                             category: "Access Control", priority: "critical" },
  { controlRef: "A.5.16", name: "Identity management",                                           description: "Manage the full lifecycle of identities.",                                                                  category: "Access Control", priority: "critical" },
  { controlRef: "A.5.17", name: "Authentication information",                                    description: "Manage allocation and use of secret authentication information.",                                           category: "Access Control", priority: "critical" },
  { controlRef: "A.5.18", name: "Access rights",                                                 description: "Provision, review, modify and revoke access rights.",                                                      category: "Access Control", priority: "critical" },
  { controlRef: "A.5.19", name: "Information security in supplier relationships",                description: "Define and implement processes to manage information security risks in supplier relationships.",            category: "Supplier",       priority: "high"     },
  { controlRef: "A.5.20", name: "Addressing information security within supplier agreements",    description: "Establish and agree relevant information security requirements with each supplier.",                        category: "Supplier",       priority: "high"     },
  { controlRef: "A.5.21", name: "Managing information security in the ICT supply chain",         description: "Manage information security risks in the ICT product and service supply chain.",                           category: "Supplier",       priority: "high"     },
  { controlRef: "A.5.22", name: "Monitoring, review and change management of supplier services", description: "Monitor, review and manage changes to supplier services.",                                                  category: "Supplier",       priority: "medium"   },
  { controlRef: "A.5.23", name: "Information security for use of cloud services",               description: "Specify and manage information security for the acquisition and use of cloud services.",                    category: "Cloud",          priority: "high"     },
  { controlRef: "A.5.24", name: "Information security incident management planning and preparation", description: "Plan and prepare for managing information security incidents.",                                          category: "Incident",       priority: "critical" },
  { controlRef: "A.5.25", name: "Assessment and decision on information security events",        description: "Assess information security events and decide if they should be classified as incidents.",                  category: "Incident",       priority: "critical" },
  { controlRef: "A.5.26", name: "Response to information security incidents",                    description: "Respond to information security incidents in accordance with the documented procedures.",                   category: "Incident",       priority: "critical" },
  { controlRef: "A.5.27", name: "Learning from information security incidents",                  description: "Use knowledge gained from incidents to reduce likelihood or impact of future incidents.",                   category: "Incident",       priority: "high"     },
  { controlRef: "A.5.28", name: "Collection of evidence",                                        description: "Establish and implement procedures for identification, collection and preservation of evidence.",            category: "Incident",       priority: "high"     },
  { controlRef: "A.5.29", name: "Information security during disruption",                        description: "Maintain information security during disruption.",                                                          category: "Continuity",     priority: "high"     },
  { controlRef: "A.5.30", name: "ICT readiness for business continuity",                         description: "Plan, implement, maintain and test ICT readiness for business continuity.",                                 category: "Continuity",     priority: "high"     },
  { controlRef: "A.5.31", name: "Legal, statutory, regulatory and contractual requirements",     description: "Identify, document and keep up to date all relevant legal and regulatory requirements.",                   category: "Compliance",     priority: "high"     },
  { controlRef: "A.5.32", name: "Intellectual property rights",                                  description: "Implement appropriate procedures to protect intellectual property rights.",                                  category: "Compliance",     priority: "medium"   },
  { controlRef: "A.5.33", name: "Protection of records",                                         description: "Protect records from loss, destruction, falsification and unauthorised access.",                            category: "Compliance",     priority: "high"     },
  { controlRef: "A.5.34", name: "Privacy and protection of PII",                                 description: "Protect privacy and PII as required by applicable legislation and regulations.",                            category: "Privacy",        priority: "critical" },
  { controlRef: "A.5.35", name: "Independent review of information security",                    description: "Review the organisation's approach to managing information security independently.",                         category: "Governance",     priority: "medium"   },
  { controlRef: "A.5.36", name: "Compliance with policies, rules and standards for information security", description: "Review compliance with information security policies and standards.",                              category: "Governance",     priority: "medium"   },
  { controlRef: "A.5.37", name: "Documented operating procedures",                               description: "Document, maintain and make available operating procedures for information processing.",                    category: "Organisational", priority: "medium"   },

  // A.6 People controls
  { controlRef: "A.6.1",  name: "Screening",                                                     description: "Carry out background verification checks on all candidates for employment.",                                category: "HR",             priority: "high"     },
  { controlRef: "A.6.2",  name: "Terms and conditions of employment",                            description: "State information security responsibilities in employment contracts.",                                      category: "HR",             priority: "high"     },
  { controlRef: "A.6.3",  name: "Information security awareness, education and training",        description: "Provide appropriate security awareness education and training.",                                             category: "HR",             priority: "high"     },
  { controlRef: "A.6.4",  name: "Disciplinary process",                                          description: "Formalise and communicate a disciplinary process for security policy violations.",                          category: "HR",             priority: "medium"   },
  { controlRef: "A.6.5",  name: "Responsibilities after termination or change of employment",    description: "Define, enforce and communicate information security responsibilities post-termination.",                   category: "HR",             priority: "high"     },
  { controlRef: "A.6.6",  name: "Confidentiality or non-disclosure agreements",                  description: "Identify, document and review confidentiality and NDA requirements.",                                       category: "HR",             priority: "high"     },
  { controlRef: "A.6.7",  name: "Remote working",                                                description: "Implement security measures for remote working.",                                                            category: "HR",             priority: "high"     },
  { controlRef: "A.6.8",  name: "Information security event reporting",                          description: "Provide a mechanism for personnel to report observed or suspected security events.",                        category: "Incident",       priority: "high"     },

  // A.7 Physical controls
  { controlRef: "A.7.1",  name: "Physical security perimeters",                                  description: "Define and use security perimeters to protect sensitive areas.",                                            category: "Physical",       priority: "high"     },
  { controlRef: "A.7.2",  name: "Physical entry",                                                description: "Secure areas protected by appropriate entry controls.",                                                     category: "Physical",       priority: "high"     },
  { controlRef: "A.7.3",  name: "Securing offices, rooms and facilities",                        description: "Design and implement physical security for offices, rooms and facilities.",                                  category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.4",  name: "Physical security monitoring",                                  description: "Monitor premises continuously for unauthorised physical access.",                                           category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.5",  name: "Protecting against physical and environmental threats",         description: "Design and implement protection against physical and environmental threats.",                                category: "Physical",       priority: "high"     },
  { controlRef: "A.7.6",  name: "Working in secure areas",                                       description: "Design and implement security measures for working in secure areas.",                                       category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.7",  name: "Clear desk and clear screen",                                   description: "Define and implement clear desk and clear screen rules.",                                                   category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.8",  name: "Equipment siting and protection",                               description: "Site and protect equipment to reduce risks from environmental threats and unauthorised access.",             category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.9",  name: "Security of assets off-premises",                               description: "Protect off-site assets from risks of external environments.",                                              category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.10", name: "Storage media",                                                 description: "Manage storage media through acquisition, use, transportation and disposal.",                               category: "Physical",       priority: "high"     },
  { controlRef: "A.7.11", name: "Supporting utilities",                                          description: "Protect equipment from power failures and disruptions caused by utilities.",                                category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.12", name: "Cabling security",                                              description: "Protect power and telecommunication cabling from interception or damage.",                                  category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.13", name: "Equipment maintenance",                                         description: "Maintain equipment correctly to ensure availability and integrity.",                                         category: "Physical",       priority: "medium"   },
  { controlRef: "A.7.14", name: "Secure disposal or re-use of equipment",                        description: "Verify that storage media has been sanitised before disposal or re-use.",                                   category: "Physical",       priority: "high"     },

  // A.8 Technological controls
  { controlRef: "A.8.1",  name: "User endpoint devices",                                         description: "Protect information on user endpoint devices.",                                                              category: "Technology",     priority: "high"     },
  { controlRef: "A.8.2",  name: "Privileged access rights",                                      description: "Restrict and manage the allocation and use of privileged access rights.",                                   category: "Access Control", priority: "critical" },
  { controlRef: "A.8.3",  name: "Information access restriction",                                description: "Restrict access to information and application functions according to the policy.",                         category: "Access Control", priority: "critical" },
  { controlRef: "A.8.4",  name: "Access to source code",                                         description: "Manage appropriate access to source code, development tools and software libraries.",                       category: "Access Control", priority: "high"     },
  { controlRef: "A.8.5",  name: "Secure authentication",                                         description: "Implement secure authentication technologies and procedures.",                                               category: "Access Control", priority: "critical" },
  { controlRef: "A.8.6",  name: "Capacity management",                                           description: "Monitor and adjust resource use and projections for future capacity needs.",                                category: "Technology",     priority: "medium"   },
  { controlRef: "A.8.7",  name: "Protection against malware",                                    description: "Implement protection against malware with user awareness.",                                                  category: "Technology",     priority: "critical" },
  { controlRef: "A.8.8",  name: "Management of technical vulnerabilities",                       description: "Obtain timely information about technical vulnerabilities and take remedial action.",                       category: "Technology",     priority: "critical" },
  { controlRef: "A.8.9",  name: "Configuration management",                                      description: "Establish, document, implement and monitor configurations of hardware, software, services and networks.",   category: "Technology",     priority: "high"     },
  { controlRef: "A.8.10", name: "Information deletion",                                          description: "Delete information stored in systems, devices or media when no longer required.",                           category: "Privacy",        priority: "high"     },
  { controlRef: "A.8.11", name: "Data masking",                                                  description: "Use data masking in accordance with the organisation's access control and business requirements.",          category: "Privacy",        priority: "high"     },
  { controlRef: "A.8.12", name: "Data leakage prevention",                                       description: "Apply DLP measures to systems and networks that process or transmit sensitive information.",                category: "Technology",     priority: "critical" },
  { controlRef: "A.8.13", name: "Information backup",                                            description: "Maintain and regularly test backup copies of information, software and systems.",                           category: "Technology",     priority: "critical" },
  { controlRef: "A.8.14", name: "Redundancy of information processing facilities",              description: "Implement redundant information processing facilities to meet availability requirements.",                   category: "Technology",     priority: "high"     },
  { controlRef: "A.8.15", name: "Logging",                                                       description: "Produce, store, protect and analyse logs that record activities, exceptions and events.",                   category: "Technology",     priority: "critical" },
  { controlRef: "A.8.16", name: "Monitoring activities",                                         description: "Monitor networks, systems and applications for anomalous behaviour.",                                       category: "Technology",     priority: "critical" },
  { controlRef: "A.8.17", name: "Clock synchronization",                                         description: "Synchronise clocks of information processing systems to approved time sources.",                            category: "Technology",     priority: "medium"   },
  { controlRef: "A.8.18", name: "Use of privileged utility programs",                            description: "Restrict and tightly control the use of utility programs with system/controls overriding capabilities.",   category: "Technology",     priority: "high"     },
  { controlRef: "A.8.19", name: "Installation of software on operational systems",               description: "Implement procedures to control software installation on operational systems.",                             category: "Technology",     priority: "high"     },
  { controlRef: "A.8.20", name: "Networks security",                                             description: "Secure networks, network services and network connections.",                                                category: "Network",        priority: "high"     },
  { controlRef: "A.8.21", name: "Security of network services",                                  description: "Identify and implement security mechanisms for network services.",                                          category: "Network",        priority: "high"     },
  { controlRef: "A.8.22", name: "Segregation of networks",                                       description: "Segregate groups of services, users and systems in the network.",                                          category: "Network",        priority: "high"     },
  { controlRef: "A.8.23", name: "Web filtering",                                                 description: "Manage access to external websites to reduce exposure to malicious content.",                               category: "Network",        priority: "medium"   },
  { controlRef: "A.8.24", name: "Use of cryptography",                                           description: "Define and implement rules for the effective use of cryptography.",                                         category: "Cryptography",   priority: "critical" },
  { controlRef: "A.8.25", name: "Secure development lifecycle",                                  description: "Establish and apply rules for the secure development of software and systems.",                             category: "Development",    priority: "high"     },
  { controlRef: "A.8.26", name: "Application security requirements",                             description: "Identify and approve information security requirements when developing or acquiring applications.",         category: "Development",    priority: "high"     },
  { controlRef: "A.8.27", name: "Secure system architecture and engineering principles",         description: "Establish, document and apply principles for engineering secure systems.",                                  category: "Development",    priority: "high"     },
  { controlRef: "A.8.28", name: "Secure coding",                                                 description: "Apply secure coding principles in software development.",                                                   category: "Development",    priority: "high"     },
  { controlRef: "A.8.29", name: "Security testing in development and acceptance",                description: "Define and implement security testing processes in the development lifecycle.",                             category: "Development",    priority: "high"     },
  { controlRef: "A.8.30", name: "Outsourced development",                                        description: "Direct, monitor and review activities related to outsourced system development.",                           category: "Development",    priority: "medium"   },
  { controlRef: "A.8.31", name: "Separation of development, test and production environments",   description: "Separate and protect development, testing and production environments.",                                    category: "Development",    priority: "high"     },
  { controlRef: "A.8.32", name: "Change management",                                             description: "Manage changes to information processing facilities and systems.",                                          category: "Development",    priority: "high"     },
  { controlRef: "A.8.33", name: "Test information",                                              description: "Ensure test information is selected, protected and managed appropriately.",                                 category: "Development",    priority: "medium"   },
  { controlRef: "A.8.34", name: "Protection of information systems during audit testing",        description: "Plan and agree audit tests and activities to minimise disruption to production.",                           category: "Governance",     priority: "low"      },
];

/* ================================================================
   SOC 2 Type II  — 33 Trust Service Criteria
   ================================================================ */

const SOC2_CONTROLS: ControlTemplate[] = [
  // CC1 Control Environment
  { controlRef: "CC1.1", name: "COSO Principle 1 — Commitment to integrity and ethics",        description: "Board and management demonstrate commitment to integrity and ethical values.",               category: "Control Environment", priority: "high"     },
  { controlRef: "CC1.2", name: "COSO Principle 2 — Board independence and oversight",          description: "Board is independent of management and exercises oversight over internal controls.",        category: "Control Environment", priority: "high"     },
  { controlRef: "CC1.3", name: "COSO Principle 3 — Organisational structure",                  description: "Management establishes structures, reporting lines and appropriate authorities.",           category: "Control Environment", priority: "medium"   },
  { controlRef: "CC1.4", name: "COSO Principle 4 — Competence of personnel",                   description: "Organisation demonstrates commitment to attract, develop and retain competent individuals.", category: "Control Environment", priority: "medium"   },
  { controlRef: "CC1.5", name: "COSO Principle 5 — Accountability for internal controls",      description: "Individuals are held accountable for their internal control responsibilities.",              category: "Control Environment", priority: "medium"   },

  // CC2 Communication and Information
  { controlRef: "CC2.1", name: "Information quality for internal controls",                     description: "Obtains, generates and uses quality information to support functioning of internal control.", category: "Communication",      priority: "medium"   },
  { controlRef: "CC2.2", name: "Internal communication of control information",                 description: "Communicates information internally to support internal control functioning.",               category: "Communication",      priority: "medium"   },
  { controlRef: "CC2.3", name: "External communication of control information",                 description: "Communicates with external parties regarding matters affecting internal control functioning.", category: "Communication",     priority: "medium"   },

  // CC3 Risk Assessment
  { controlRef: "CC3.1", name: "Specifies suitable objectives",                                 description: "Specifies objectives with sufficient clarity to enable risk identification.",                category: "Risk Assessment",    priority: "high"     },
  { controlRef: "CC3.2", name: "Identifies and analyses risk",                                  description: "Identifies risks to achieving objectives and analyses them.",                                category: "Risk Assessment",    priority: "high"     },
  { controlRef: "CC3.3", name: "Considers fraud potential",                                     description: "Considers the potential for fraud in assessing risks.",                                      category: "Risk Assessment",    priority: "high"     },
  { controlRef: "CC3.4", name: "Identifies and assesses significant change",                    description: "Identifies and assesses changes that could significantly impact internal controls.",         category: "Risk Assessment",    priority: "high"     },

  // CC4 Monitoring Activities
  { controlRef: "CC4.1", name: "Conducts ongoing and separate evaluations",                     description: "Selects, develops and performs ongoing evaluations of internal controls.",                  category: "Monitoring",         priority: "medium"   },
  { controlRef: "CC4.2", name: "Evaluates and communicates deficiencies",                       description: "Evaluates and communicates internal control deficiencies to responsible parties.",          category: "Monitoring",         priority: "medium"   },

  // CC5 Control Activities
  { controlRef: "CC5.1", name: "Selects and develops control activities",                       description: "Selects and develops control activities that mitigate risks.",                               category: "Control Activities", priority: "high"     },
  { controlRef: "CC5.2", name: "Selects and develops technology controls",                      description: "Selects and develops technology general controls to support objectives.",                    category: "Control Activities", priority: "high"     },
  { controlRef: "CC5.3", name: "Deploys through policies and procedures",                       description: "Deploys control activities through policies and procedures.",                                category: "Control Activities", priority: "medium"   },

  // CC6 Logical and Physical Access
  { controlRef: "CC6.1", name: "Logical access security software",                              description: "Uses logical access security software to protect against threats.",                          category: "Access Control",     priority: "critical" },
  { controlRef: "CC6.2", name: "New internal user access provisioning",                         description: "Provisioning of access for new users based on business need.",                              category: "Access Control",     priority: "critical" },
  { controlRef: "CC6.3", name: "User access modifications and removals",                        description: "Removes access when no longer required and modifies access based on role changes.",         category: "Access Control",     priority: "critical" },
  { controlRef: "CC6.4", name: "Physical access security measures",                             description: "Physical access to facilities and protected information assets is restricted.",              category: "Physical",           priority: "high"     },
  { controlRef: "CC6.5", name: "Logical and physical access removal",                           description: "Terminates or modifies logical and physical access on change of employment.",               category: "Access Control",     priority: "critical" },
  { controlRef: "CC6.6", name: "External threats to system components",                         description: "Implements controls to prevent or detect and act on threats from outside system boundaries.", category: "Technology",        priority: "critical" },
  { controlRef: "CC6.7", name: "Transmission, movement and removal of information",             description: "Restricts and controls transmission, movement and removal of information.",                  category: "Data Protection",    priority: "high"     },
  { controlRef: "CC6.8", name: "Prevention and detection of malicious software",                description: "Implements controls to prevent or detect and act upon introduction of malware.",             category: "Technology",         priority: "critical" },

  // CC7 System Operations
  { controlRef: "CC7.1", name: "Configuration and vulnerability management",                    description: "Uses detection and monitoring procedures to identify configuration changes and vulnerabilities.", category: "Technology",       priority: "critical" },
  { controlRef: "CC7.2", name: "Monitors infrastructure and software for anomalies",            description: "Monitors infrastructure and software for anomalies that may indicate malicious acts.",      category: "Technology",         priority: "critical" },
  { controlRef: "CC7.3", name: "Evaluates security events",                                     description: "Evaluates security events to determine whether they could or have resulted in failure.",     category: "Incident",           priority: "critical" },
  { controlRef: "CC7.4", name: "Responds to identified security incidents",                     description: "Responds to security incidents and communicates with affected parties.",                     category: "Incident",           priority: "critical" },
  { controlRef: "CC7.5", name: "Identifies, develops and implements remediation",               description: "Identifies, develops and implements remediation activities to recover from incidents.",      category: "Incident",           priority: "high"     },

  // CC8 Change Management
  { controlRef: "CC8.1", name: "Authorises, designs, develops and tests changes",               description: "Authorises, designs, develops, configures, documents, tests, reviews and approves changes.", category: "Change Management", priority: "high"     },

  // CC9 Risk Mitigation
  { controlRef: "CC9.1", name: "Identifies, selects and develops risk mitigation",              description: "Identifies, selects and develops risk mitigation activities for business disruption risks.", category: "Risk",               priority: "high"     },
  { controlRef: "CC9.2", name: "Assesses and manages vendor and business partner risk",         description: "Assesses and manages risks associated with vendors and business partners.",                  category: "Supplier",           priority: "high"     },
];

/* ================================================================
   DPDP Act 2023 (India)  — 18 principal obligations
   ================================================================ */

const DPDP_CONTROLS: ControlTemplate[] = [
  { controlRef: "DPDP.1",  name: "Lawful processing — notice and consent",              description: "Process personal data only with valid consent or other lawful basis; provide clear notice.", category: "Consent",        priority: "critical" },
  { controlRef: "DPDP.2",  name: "Purpose limitation",                                  description: "Collect and process personal data only for specified, explicit and legitimate purposes.",       category: "Data Principles", priority: "critical" },
  { controlRef: "DPDP.3",  name: "Data minimisation",                                   description: "Collect only personal data that is adequate and necessary for the processing purpose.",         category: "Data Principles", priority: "high"     },
  { controlRef: "DPDP.4",  name: "Data accuracy",                                       description: "Ensure personal data is accurate and updated; correct inaccurate data promptly.",               category: "Data Principles", priority: "high"     },
  { controlRef: "DPDP.5",  name: "Storage limitation",                                  description: "Retain personal data only for as long as necessary for the stated purpose.",                    category: "Data Principles", priority: "high"     },
  { controlRef: "DPDP.6",  name: "Security safeguards",                                 description: "Implement reasonable security safeguards to prevent personal data breaches.",                   category: "Security",        priority: "critical" },
  { controlRef: "DPDP.7",  name: "Data breach notification",                            description: "Notify the Data Protection Board and affected data principals in the event of a breach.",       category: "Incident",        priority: "critical" },
  { controlRef: "DPDP.8",  name: "Grievance redressal mechanism",                       description: "Establish a grievance redressal mechanism and appoint a Grievance Officer.",                    category: "Rights",          priority: "high"     },
  { controlRef: "DPDP.9",  name: "Data principal right to access",                      description: "Provide data principals with the right to access their personal data on request.",              category: "Rights",          priority: "high"     },
  { controlRef: "DPDP.10", name: "Data principal right to correction and erasure",      description: "Allow data principals to correct inaccurate data and request erasure.",                         category: "Rights",          priority: "high"     },
  { controlRef: "DPDP.11", name: "Data principal right to nominate",                    description: "Allow data principals to nominate another individual to exercise their rights in case of death or incapacity.", category: "Rights", priority: "medium"  },
  { controlRef: "DPDP.12", name: "Cross-border data transfers",                         description: "Transfer personal data outside India only to permitted countries per government notification.",  category: "Transfers",       priority: "high"     },
  { controlRef: "DPDP.13", name: "Children's personal data",                            description: "Obtain verifiable parental consent before processing children's personal data; no tracking.", category: "Consent",         priority: "critical" },
  { controlRef: "DPDP.14", name: "Consent Manager obligations",                         description: "Where using a Consent Manager, ensure registration and compliance with Board requirements.",    category: "Consent",         priority: "medium"   },
  { controlRef: "DPDP.15", name: "Significant Data Fiduciary obligations",              description: "If designated as SDF, appoint DPO, conduct DPIA, audit processing activities.",                category: "Governance",      priority: "high"     },
  { controlRef: "DPDP.16", name: "Data Protection Impact Assessment (DPIA)",            description: "Conduct DPIAs for high-risk processing activities (required for SDFs).",                        category: "Governance",      priority: "high"     },
  { controlRef: "DPDP.17", name: "Data processing agreements with processors",          description: "Establish written agreements with data processors ensuring DPDP compliance.",                   category: "Supplier",        priority: "high"     },
  { controlRef: "DPDP.18", name: "Retention and deletion policy",                       description: "Implement and enforce a personal data retention and deletion policy.",                           category: "Data Principles", priority: "high"     },
];

/* ================================================================
   PCI DSS v4.0  — 12 requirements
   ================================================================ */

const PCI_DSS_CONTROLS: ControlTemplate[] = [
  { controlRef: "Req 1",  name: "Install and maintain network security controls",                 description: "Network security controls protect cardholder data environment from external and internal threats.", category: "Network",        priority: "critical" },
  { controlRef: "Req 2",  name: "Apply secure configurations to all system components",           description: "Malicious actors use default and known passwords to compromise systems.",                            category: "Technology",     priority: "critical" },
  { controlRef: "Req 3",  name: "Protect stored account data",                                    description: "Protection of stored account data minimises impact of a data compromise.",                          category: "Data Protection", priority: "critical" },
  { controlRef: "Req 4",  name: "Protect cardholder data with strong cryptography during transmission", description: "Encrypt transmission of cardholder data across open, public networks.",                      category: "Cryptography",   priority: "critical" },
  { controlRef: "Req 5",  name: "Protect all systems and networks from malicious software",       description: "Deploy anti-malware solutions on all systems susceptible to malware.",                              category: "Technology",     priority: "critical" },
  { controlRef: "Req 6",  name: "Develop and maintain secure systems and software",               description: "Apply security patches; follow secure development practices.",                                       category: "Development",    priority: "critical" },
  { controlRef: "Req 7",  name: "Restrict access to system components and cardholder data by business need to know", description: "Implement access control based on least privilege and need-to-know.", category: "Access Control",  priority: "critical" },
  { controlRef: "Req 8",  name: "Identify users and authenticate access to system components",    description: "Assign a unique ID to each user and implement strong authentication.",                              category: "Access Control", priority: "critical" },
  { controlRef: "Req 9",  name: "Restrict physical access to cardholder data",                    description: "Physical controls prevent unauthorised individuals from accessing systems.",                         category: "Physical",       priority: "high"     },
  { controlRef: "Req 10", name: "Log and monitor all access to system components and cardholder data", description: "Logging and monitoring enable detection of anomalies and data breaches.",                    category: "Monitoring",     priority: "critical" },
  { controlRef: "Req 11", name: "Test security of systems and networks regularly",                description: "Vulnerabilities must be discovered through regular testing.",                                         category: "Testing",        priority: "high"     },
  { controlRef: "Req 12", name: "Support information security with organisational policies and programs", description: "Operational policies and programs govern and support protection of cardholder data.",      category: "Governance",     priority: "high"     },
];

/* ================================================================
   HIPAA  — 18 key safeguard standards
   ================================================================ */

const HIPAA_CONTROLS: ControlTemplate[] = [
  // Administrative safeguards
  { controlRef: "§164.308(a)(1)", name: "Security management process",                           description: "Implement policies and procedures to prevent, detect, contain and correct security violations.",     category: "Administrative", priority: "critical" },
  { controlRef: "§164.308(a)(2)", name: "Assigned security responsibility",                      description: "Identify the security official responsible for developing and implementing security policies.",        category: "Administrative", priority: "high"     },
  { controlRef: "§164.308(a)(3)", name: "Workforce security",                                    description: "Implement policies to ensure workforce members have appropriate access to ePHI.",                     category: "Administrative", priority: "high"     },
  { controlRef: "§164.308(a)(4)", name: "Information access management",                         description: "Implement policies for authorising access to ePHI consistent with Privacy Rule.",                    category: "Administrative", priority: "critical" },
  { controlRef: "§164.308(a)(5)", name: "Security awareness and training",                       description: "Implement security awareness and training program for all workforce members.",                        category: "Administrative", priority: "high"     },
  { controlRef: "§164.308(a)(6)", name: "Security incident procedures",                          description: "Implement policies and procedures to address security incidents.",                                     category: "Administrative", priority: "critical" },
  { controlRef: "§164.308(a)(7)", name: "Contingency plan",                                      description: "Establish and implement policies for responding to emergencies affecting ePHI.",                      category: "Administrative", priority: "high"     },
  { controlRef: "§164.308(a)(8)", name: "Evaluation",                                            description: "Perform periodic technical and non-technical evaluation of security policies.",                       category: "Administrative", priority: "medium"   },
  { controlRef: "§164.308(b)(1)", name: "Business associate contracts",                          description: "Obtain satisfactory assurances from business associates that ePHI will be safeguarded.",              category: "Administrative", priority: "high"     },

  // Physical safeguards
  { controlRef: "§164.310(a)(1)", name: "Facility access controls",                              description: "Implement policies to limit physical access to electronic information systems.",                      category: "Physical",       priority: "high"     },
  { controlRef: "§164.310(b)",    name: "Workstation use",                                        description: "Implement policies specifying proper functions performed on workstations containing ePHI.",          category: "Physical",       priority: "medium"   },
  { controlRef: "§164.310(c)",    name: "Workstation security",                                   description: "Implement physical safeguards for workstations that access ePHI.",                                   category: "Physical",       priority: "medium"   },
  { controlRef: "§164.310(d)(1)", name: "Device and media controls",                             description: "Implement policies for receipt and removal of hardware and media containing ePHI.",                   category: "Physical",       priority: "high"     },

  // Technical safeguards
  { controlRef: "§164.312(a)(1)", name: "Access control",                                        description: "Implement technical policies to allow only authorised persons to access ePHI.",                      category: "Technical",      priority: "critical" },
  { controlRef: "§164.312(b)",    name: "Audit controls",                                         description: "Implement hardware, software and procedural mechanisms to examine system activity.",                 category: "Technical",      priority: "critical" },
  { controlRef: "§164.312(c)(1)", name: "Integrity controls",                                    description: "Implement electronic mechanisms to confirm ePHI has not been improperly altered or destroyed.",      category: "Technical",      priority: "high"     },
  { controlRef: "§164.312(d)",    name: "Person or entity authentication",                        description: "Implement procedures to verify a person seeking access to ePHI is who they claim.",                 category: "Technical",      priority: "critical" },
  { controlRef: "§164.312(e)(1)", name: "Transmission security",                                 description: "Implement technical security measures to guard against unauthorised access to ePHI in transit.",     category: "Technical",      priority: "critical" },
];

/* ================================================================
   Framework template registry
   ================================================================ */

export const FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  {
    key: "iso27001",
    name: "ISO 27001:2022",
    version: "2022",
    description: "Information Security Management System",
    controls: ISO27001_CONTROLS,
  },
  {
    key: "soc2",
    name: "SOC 2 Type II",
    version: "2017",
    description: "Trust Service Criteria for security, availability, processing integrity, confidentiality and privacy",
    controls: SOC2_CONTROLS,
  },
  {
    key: "dpdp",
    name: "DPDP Act 2023",
    version: "2023",
    description: "Digital Personal Data Protection Act — India",
    controls: DPDP_CONTROLS,
  },
  {
    key: "pcidss",
    name: "PCI DSS v4.0",
    version: "4.0",
    description: "Payment Card Industry Data Security Standard",
    controls: PCI_DSS_CONTROLS,
  },
  {
    key: "hipaa",
    name: "HIPAA",
    version: "2013",
    description: "Health Insurance Portability and Accountability Act security safeguards",
    controls: HIPAA_CONTROLS,
  },
];

export const FRAMEWORK_TEMPLATE_MAP = new Map(
  FRAMEWORK_TEMPLATES.map((t) => [t.key, t])
);

/** Total controls across all built-in frameworks. */
export const TOTAL_BUILTIN_CONTROLS = FRAMEWORK_TEMPLATES.reduce(
  (n, t) => n + t.controls.length,
  0
);
