"use client";

import { useState, useEffect } from "react";
import image1 from "./image/signup.png";
import image2 from "./image/uploadcomponent.png";
import image3 from "./image/price.png";
import image4 from "./image/sellerdashboard.png";

const About = () => {
  const [activeTab, setActiveTab] = useState("buyer");
  const [isMobile, setIsMobile] = useState(false);
  const [showBuyerGuide, setShowBuyerGuide] = useState(false);
  const [showSellerGuide, setShowSellerGuide] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Function to handle tab switching - improves user experience by showing relevant content
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setShowBuyerGuide(false);
    setShowSellerGuide(false);
  };

  const buyerImplementationSteps = [
    {
      step: 1,
      title: "Install Component Package",
      code: `npm install @marketplace/component-name
# or
yarn add @marketplace/component-name`,
      description:
        "Install the component package using your preferred package manager",
    },
    {
      step: 2,
      title: "Import Component",
      code: `import { ComponentName } from '@marketplace/component-name';
import '@marketplace/component-name/styles.css';`,
      description: "Import the component and its styles into your project",
    },
    {
      step: 3,
      title: "Use in Your App",
      code: `function MyApp() {
  return (
    <div>
      <ComponentName 
        prop1="value1"
        prop2="value2"
        onAction={handleAction}
      />
    </div>
  );
}`,
      description: "Integrate the component with your application logic",
    },
    {
      step: 4,
      title: "Customize & Configure",
      code: `// Custom styling
.component-name {
  --primary-color: #your-brand-color;
  --border-radius: 8px;
}

// Advanced configuration
<ComponentName
  theme="dark"
  size="large"
  customConfig={{
    animation: true,
    responsive: true
  }}
/>`,
      description: "Customize the component to match your design system",
    },
  ];

  const sellerUploadSteps = [
    {
      step: 1,
      title: "Prepare Component Structure",
      code: `my-component/
├── src/
│   ├── index.tsx          # Main component
│   ├── types.ts           # TypeScript definitions
│   └── styles.css         # Component styles
├── examples/
│   └── basic-usage.tsx    # Usage examples
├── package.json           # Package configuration
├── README.md             # Documentation
└── LICENSE               # License file`,
      description:
        "Organize your component files in a clear, professional structure",
    },
    {
      step: 2,
      title: "Create Package.json",
      code: `{
  "name": "@your-namespace/component-name",
  "version": "1.0.0",
  "description": "Your component description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md"],
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  },
  "keywords": ["react", "component", "ui"]
}`,
      description:
        "Configure your package with proper metadata and dependencies",
    },
    {
      step: 3,
      title: "Add Documentation",
      code: `# Component Name

## Installation
\`\`\`bash
npm install @your-namespace/component-name
\`\`\`

## Usage
\`\`\`jsx
import { ComponentName } from '@your-namespace/component-name';

function App() {
  return <ComponentName prop="value" />;
}
\`\`\`

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | 'default' | Description |`,
      description:
        "Write comprehensive documentation with examples and API reference",
    },
    {
      step: 4,
      title: "Upload to Marketplace",
      code: `# Build your component
npm run build

# Test the package locally
npm pack
npm install ./your-component-1.0.0.tgz

# Upload via marketplace dashboard
# - Drag & drop your component folder
# - Add screenshots and demos
# - Set pricing and categories
# - Publish for review`,
      description:
        "Build, test, and upload your component through our platform",
    },
  ];

  const buyerSteps = [
    {
      step: 1,
      title: "Browse Components",
      description:
        "Explore our vast collection of high-quality React components. Use filters to find exactly what you need for your project.",
      details:
        "Search by category, price range, or popularity. Each component comes with live previews and detailed documentation.",
      screenshot: image1,
    },
    {
      step: 2,
      title: "Preview & Test",
      description:
        "View live demos and code examples before making a purchase. See exactly how components work in real applications.",
      details:
        "Interactive demos, responsive previews, and complete code documentation help you make informed decisions.",
      screenshot: image2,
    },
    {
      step: 3,
      title: "Secure Purchase",
      description:
        "Buy components with confidence using our secure payment system. Instant access to downloads and documentation.",
      details:
        "Multiple payment options, instant delivery, and lifetime access to purchased components with free updates.",
      screenshot: image3,
    },
    {
      step: 4,
      title: "Download & Integrate",
      description:
        "Get immediate access to component files, documentation, and integration guides. Start building right away.",
      details:
        "Clean, well-documented code with installation instructions, usage examples, and customization guides.",
      screenshot: image4,
    },
  ];

  const sellerSteps = [
    {
      step: 1,
      title: "Create Seller Account",
      description:
        "Join our community of component creators. Set up your seller profile and showcase your expertise.",
      details:
        "Complete verification process, set up payment details, and create an attractive seller profile to build trust.",
      screenshot: image1,
    },
    {
      step: 2,
      title: "Upload Components",
      description:
        "Share your React components with the world. Upload files, add descriptions, and set competitive prices.",
      details:
        "Easy upload process with drag-and-drop functionality, automatic code validation, and preview generation.",
      screenshot: image2,
    },
    {
      step: 3,
      title: "Set Pricing & Details",
      description:
        "Configure pricing, add detailed descriptions, tags, and screenshots. Make your components discoverable.",
      details:
        "Flexible pricing options, rich text descriptions, category tagging, and SEO optimization for better visibility.",
      screenshot: image3,
    },
    {
      step: 4,
      title: "Earn & Grow",
      description:
        "Start earning from your components. Track sales, manage customers, and grow your component business.",
      details:
        "Real-time analytics, customer feedback system, automated payouts, and marketing tools to boost sales.",
      screenshot: image4,
    },
  ];

  const codeUploadBestPractices = [
    {
      title: "Code Structure & Organization",
      description:
        "Organize your components with clear folder structure and meaningful file names",
      tips: [
        "Use descriptive component names (e.g., 'UserProfileCard' instead of 'Card1')",
        "Separate components, styles, and utilities into different folders",
        "Include index.js files for easy imports",
        "Follow consistent naming conventions (PascalCase for components)",
      ],
    },
    {
      title: "Documentation & Comments",
      description: "Provide comprehensive documentation for easy integration",
      tips: [
        "Include JSDoc comments for all props and functions",
        "Add README.md with installation and usage instructions",
        "Provide live examples and code snippets",
        "Document any dependencies and peer dependencies",
      ],
    },
    {
      title: "Code Quality Standards",
      description: "Ensure your code meets professional standards",
      tips: [
        "Use TypeScript for better type safety and developer experience",
        "Follow ESLint and Prettier configurations",
        "Write unit tests for critical functionality",
        "Optimize for performance (memo, useMemo, useCallback when needed)",
      ],
    },
    {
      title: "Responsive Design",
      description: "Make components work seamlessly across all devices",
      tips: [
        "Use CSS Grid and Flexbox for flexible layouts",
        "Implement mobile-first responsive design",
        "Test on multiple screen sizes and devices",
        "Use relative units (rem, em, %) instead of fixed pixels",
      ],
    },
  ];

  const downloadImplementationSteps = [
    {
      step: 1,
      title: "Prepare Your Component Files",
      description: "Organize all necessary files before upload",
      details:
        "Include component files, styles, documentation, examples, and any required assets in a structured folder.",
    },
    {
      step: 2,
      title: "Create Package Structure",
      description: "Follow standard package conventions",
      details:
        "Include package.json, README.md, LICENSE, and proper entry points for easy installation and usage.",
    },
    {
      step: 3,
      title: "Test Integration Process",
      description: "Verify your component works in different environments",
      details:
        "Test installation via npm/yarn, verify imports work correctly, and ensure no missing dependencies.",
    },
    {
      step: 4,
      title: "Provide Implementation Examples",
      description: "Include practical usage examples",
      details:
        "Show basic usage, advanced configurations, styling customization, and integration with popular frameworks.",
    },
  ];

  const currentSteps = activeTab === "buyer" ? buyerSteps : sellerSteps;

  return (
    <div
      className="container about-section-padding"
      style={{
        paddingTop: "2rem",
        paddingBottom: "4rem",
        maxWidth: "100%",
        margin: "0 auto",
        padding: "0 clamp(1rem, 4vw, 2rem)",
      }}
    >
      {/* Hero Section */}
      <div
        className="about-hero"
        style={{
          textAlign: "center",
          marginBottom: "4rem",
          padding: "0 1rem",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: "700",
            marginBottom: "1.5rem",
            color: "#000000",
            lineHeight: "1.2",
            marginTop: "4rem",
          }}
        >
          How Component Marketplace Works
        </h1>
        <p
          style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
            color: "var(--color-fg-muted)",
            maxWidth: "700px",
            margin: "0 auto",
            lineHeight: "1.7",
          }}
        >
          Whether you're looking to buy high-quality components or sell your own
          creations, our platform makes it simple and secure for everyone.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            marginTop: "3rem",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => {
              setShowBuyerGuide(!showBuyerGuide);
              setShowSellerGuide(false);
            }}
            style={{
              padding: "16px 32px",
              fontSize: "clamp(1.1rem, 2.5vw, 1.2rem)",
              minWidth: "220px",
              textAlign: "center",
              fontWeight: "600",
              borderRadius: "12px",
              backgroundColor: showBuyerGuide ? "#000000" : "green",
              color: "white",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            }}
          >
            {showBuyerGuide ? "Hide" : "Show"} How to Buy & Implement
          </button>
          <button
            onClick={() => {
              setShowSellerGuide(!showSellerGuide);
              setShowBuyerGuide(false);
            }}
            style={{
              padding: "16px 32px",
              fontSize: "clamp(1.1rem, 2.5vw, 1.2rem)",
              minWidth: "220px",
              textAlign: "center",
              fontWeight: "600",
              borderRadius: "12px",
              backgroundColor: showSellerGuide ? "#000000" : "green",
              color: "white",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            }}
          >
            {showSellerGuide ? "Hide" : "Show"} How to Sell & Upload
          </button>
        </div>
      </div>

      {showBuyerGuide && (
        <div
          style={{
            marginBottom: "6rem",
            background: "white",
            borderRadius: "16px",
            padding: "clamp(2rem, 5vw, 4rem)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: "700",
              marginBottom: "3rem",
              color: "#000000",
              position: "relative",
            }}
          >
            Complete Buyer Implementation Guide
            <div
              style={{
                position: "absolute",
                bottom: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80px",
                height: "4px",
                background: "green",
                borderRadius: "2px",
              }}
            />
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3rem",
            }}
          >
            {buyerImplementationSteps.map((step, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "2rem",
                  padding: "2rem",
                  backgroundColor: "#f8f9fa",
                  border: "2px solid #e5e5e5",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "green",
                    color: "white",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {step.step}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "#000000",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "1.1rem",
                      color: "var(--color-fg-muted)",
                      marginBottom: "1.5rem",
                      lineHeight: "1.6",
                    }}
                  >
                    {step.description}
                  </p>
                  <pre
                    style={{
                      backgroundColor: "#1a1a1a",
                      color: "#ffffff",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      overflow: "auto",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                      fontFamily: "monospace",
                    }}
                  >
                    <code>{step.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSellerGuide && (
        <div
          style={{
            marginBottom: "6rem",
            background: "white",
            borderRadius: "16px",
            padding: "clamp(2rem, 5vw, 4rem)",
            border: "2px solid #e5e5e5",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: "700",
              marginBottom: "3rem",
              color: "#000000",
              position: "relative",
            }}
          >
            Complete Seller Upload Guide
            <div
              style={{
                position: "absolute",
                bottom: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80px",
                height: "4px",
                background: "green",
                borderRadius: "2px",
              }}
            />
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3rem",
            }}
          >
            {sellerUploadSteps.map((step, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "2rem",
                  padding: "2rem",
                  backgroundColor: "#f8f9fa",
                  border: "2px solid #e5e5e5",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "green",
                    color: "white",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {step.step}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "#000000",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "1.1rem",
                      color: "var(--color-fg-muted)",
                      marginBottom: "1.5rem",
                      lineHeight: "1.6",
                    }}
                  >
                    {step.description}
                  </p>
                  <pre
                    style={{
                      backgroundColor: "#1a1a1a",
                      color: "#ffffff",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      overflow: "auto",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                      fontFamily: "monospace",
                    }}
                  >
                    <code>{step.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginBottom: "6rem",
          background: "white",
          borderRadius: "16px",
          padding: "clamp(2rem, 5vw, 4rem)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: "700",
            marginBottom: "3rem",
            color: "#000000",
            position: "relative",
          }}
        >
          How to Upload Content & Create Clean Code
          <div
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80px",
              height: "4px",
              background: "#000000",
              borderRadius: "2px",
            }}
          />
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: "2rem",
            marginBottom: "3rem",
          }}
        >
          {codeUploadBestPractices.map((practice, index) => (
            <div
              key={index}
              style={{
                padding: "2rem",
                backgroundColor: "white",
                border: "2px solid #e5e5e5",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "green",
                }}
              >
                {practice.title}
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "var(--color-fg-muted)",
                  marginBottom: "1.5rem",
                  lineHeight: "1.6",
                }}
              >
                {practice.description}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: "0",
                  margin: "0",
                }}
              >
                {practice.tips.map((tip, tipIndex) => (
                  <li
                    key={tipIndex}
                    style={{
                      fontSize: "1rem",
                      color: "var(--color-fg-default)",
                      marginBottom: "0.8rem",
                      paddingLeft: "1.5rem",
                      position: "relative",
                      lineHeight: "1.6",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: "0",
                        color: "green",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                      }}
                    >
                      ✓
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginBottom: "6rem",
          background: "white",
          borderRadius: "16px",
          padding: "clamp(2rem, 5vw, 4rem)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: "700",
            marginBottom: "3rem",
            color: "#000000",
            position: "relative",
          }}
        >
          Seller Guide: Download & Implementation Process
          <div
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80px",
              height: "4px",
              background: "#000000",
              borderRadius: "2px",
            }}
          />
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {downloadImplementationSteps.map((step, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "flex-start",
                gap: "2rem",
                padding: "2rem",
                backgroundColor: "var(--color-canvas-default)",
                border: "2px solid #e5e5e5",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "green",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  flexShrink: 0,
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                }}
              >
                {step.step}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "600",
                    marginBottom: "0.8rem",
                    color: "#000000",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "var(--color-fg-default)",
                    marginBottom: "0.8rem",
                    lineHeight: "1.6",
                  }}
                >
                  {step.description}
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-fg-muted)",
                    lineHeight: "1.6",
                  }}
                >
                  {step.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "4rem",
          padding: "0 1rem",
        }}
      >
        <div
          className="tab-navigation"
          style={{
            display: "flex",
            background: "white",
            borderRadius: "12px",
            padding: "6px",
            border: "2px solid #e5e5e5",
            width: "100%",
            maxWidth: "500px",
          }}
        >
          <button
            onClick={() => handleTabSwitch("buyer")}
            className={`btn tab-button ${
              activeTab === "buyer" ? "btn-primary" : "btn-secondary"
            }`}
            style={{
              margin: "0",
              borderRadius: "8px",
              padding: "16px 32px",
              fontWeight: "600",
              marginRight: "0.5rem",
              flex: 1,
              fontSize: "clamp(1rem, 2vw, 1.1rem)",
              backgroundColor: activeTab === "buyer" ? "green" : "transparent",
              color: activeTab === "buyer" ? "white" : "#000000",
              border: activeTab === "buyer" ? "none" : "2px solid #d1d5db",
              transition: "all 0.3s ease",
            }}
          >
            For Buyers
          </button>
          <button
            onClick={() => handleTabSwitch("seller")}
            className={`btn tab-button ${
              activeTab === "seller" ? "btn-primary" : "btn-secondary"
            }`}
            style={{
              margin: "0",
              borderRadius: "8px",
              padding: "16px 32px",
              fontWeight: "600",
              flex: 1,
              fontSize: "clamp(1rem, 2vw, 1.1rem)",
              backgroundColor: activeTab === "seller" ? "green" : "transparent",
              color: activeTab === "seller" ? "white" : "#000000",
              border: activeTab === "seller" ? "none" : "2px solid #d1d5db",
              transition: "all 0.3s ease",
            }}
          >
            For Sellers
          </button>
        </div>
      </div>

      <div
        className="tab-content"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 1rem",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: "700",
            marginBottom: "4rem",
            color: "#000000",
          }}
        >
          {activeTab === "buyer"
            ? "How to Buy Components"
            : "How to Sell Components"}
        </h2>

        <div
          className="step-gap"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? "3rem" : "5rem",
          }}
        >
          {currentSteps.map((stepData, index) => (
            <div
              key={stepData.step}
              className="step-container"
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "2rem" : "4rem",
                flexDirection: isMobile
                  ? "column"
                  : index % 2 === 0
                  ? "row"
                  : "row-reverse",
                padding: "2rem",
                backgroundColor: "white",
                borderRadius: "16px",
                border: "1px solid #e5e5e5",
              }}
            >
              {/* Content Side */}
              <div
                className="step-content"
                style={{
                  flex: "1",
                  minWidth: isMobile ? "100%" : "350px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    marginBottom: "1.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    className="step-number"
                    style={{
                      width: "60px",
                      height: "60px",
                      background: "green",
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.8rem",
                      fontWeight: "bold",
                      flexShrink: 0,
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    {stepData.step}
                  </div>
                  <h3
                    className="step-title"
                    style={{
                      fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
                      fontWeight: "700",
                      margin: "0",
                      color: "#000000",
                    }}
                  >
                    {stepData.title}
                  </h3>
                </div>

                <p
                  className="step-description"
                  style={{
                    fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)",
                    color: "var(--color-fg-default)",
                    marginBottom: "1.2rem",
                    lineHeight: "1.7",
                    fontWeight: "500",
                  }}
                >
                  {stepData.description}
                </p>

                <p
                  style={{
                    fontSize: "clamp(1rem, 2vw, 1.1rem)",
                    color: "var(--color-fg-muted)",
                    lineHeight: "1.6",
                  }}
                >
                  {stepData.details}
                </p>
              </div>

              {/* Screenshot Side */}
              <div
                className="step-screenshot"
                style={{
                  flex: "1",
                  minWidth: isMobile ? "100%" : "350px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    background: "white",
                    border: "2px solid #e5e5e5",
                    borderRadius: "16px",
                    padding: "2rem",
                    textAlign: "center",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <img
                    src={stepData.screenshot || "/placeholder.svg"}
                    alt={`Step ${stepData.step}: ${stepData.title}`}
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      height: "240px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      border: "2px solid #e5e5e5",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <p
                    style={{
                      marginTop: "1.5rem",
                      fontSize: "1rem",
                      color: "#000000",
                      fontWeight: "600",
                    }}
                  >
                    {stepData.title} Interface
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div
        style={{
          marginTop: "6rem",
          textAlign: "center",
          padding: "0 1rem",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: "700",
            marginBottom: "4rem",
            color: "#000000",
          }}
        >
          Why Choose Component Marketplace?
        </h2>

        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2rem",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              padding: "2.5rem",
              background: "white",
              border: "2px solid #e5e5e5",
              borderRadius: "16px",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(1.2rem, 2.5vw, 1.4rem)",
                fontWeight: "600",
                marginBottom: "1.2rem",
                color: "#000000",
              }}
            >
              Secure Transactions
            </h3>
            <p
              style={{
                color: "var(--color-fg-muted)",
                lineHeight: "1.7",
                fontSize: "clamp(1rem, 2vw, 1.1rem)",
              }}
            >
              All payments are processed securely with industry-standard
              encryption. Your financial information is always protected.
            </p>
          </div>

          <div
            style={{
              padding: "2.5rem",
              background: "white",
              border: "2px solid #e5e5e5",
              borderRadius: "16px",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(1.2rem, 2.5vw, 1.4rem)",
                fontWeight: "600",
                marginBottom: "1.2rem",
                color: "#000000",
              }}
            >
              Instant Access
            </h3>
            <p
              style={{
                color: "var(--color-fg-muted)",
                lineHeight: "1.7",
                fontSize: "clamp(1rem, 2vw, 1.1rem)",
              }}
            >
              Get immediate access to your purchased components with lifetime
              updates and comprehensive documentation.
            </p>
          </div>

          <div
            style={{
              padding: "2.5rem",
              background: "white",
              border: "2px solid #e5e5e5",
              borderRadius: "16px",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(1.2rem, 2.5vw, 1.4rem)",
                fontWeight: "600",
                marginBottom: "1.2rem",
                color: "#000000",
              }}
            >
              Quality Guaranteed
            </h3>
            <p
              style={{
                color: "var(--color-fg-muted)",
                lineHeight: "1.7",
                fontSize: "clamp(1rem, 2vw, 1.1rem)",
              }}
            >
              Every component is reviewed for quality, performance, and best
              practices before being listed on our marketplace.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "6rem",
          textAlign: "center",
          padding: "clamp(2.5rem, 5vw, 4rem)",
          background: "white",
          borderRadius: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: "700",
            marginBottom: "1.5rem",
            color: "#000000",
          }}
        >
          Ready to Get Started?
        </h2>
        <p
          style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)",
            color: "var(--color-fg-muted)",
            marginBottom: "3rem",
            maxWidth: "700px",
            margin: "0 auto 3rem",
            lineHeight: "1.7",
          }}
        >
          Join thousands of developers who are already building amazing projects
          with our components.
        </p>
        <div
          className="cta-buttons"
          style={{
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
          }}
        >
          <a
            href="/components"
            className="btn btn-primary"
            style={{
              padding: "16px 32px",
              fontSize: "clamp(1.1rem, 2.5vw, 1.2rem)",
              minWidth: "220px",
              textAlign: "center",
              fontWeight: "600",
              borderRadius: "12px",
            }}
          >
            Browse Components
          </a>
          <a
            href="/register"
            className="btn btn-secondary"
            style={{
              padding: "16px 32px",
              fontSize: "clamp(1.1rem, 2.5vw, 1.2rem)",
              minWidth: "220px",
              textAlign: "center",
              fontWeight: "600",
              borderRadius: "12px",
            }}
          >
            Start Selling
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
