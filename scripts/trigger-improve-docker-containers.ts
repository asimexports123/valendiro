import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveDockerContainers() {
  console.log("Improving Docker Containers knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "Docker is an open platform for developing, shipping, and running applications in containers.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "platform"],
      },
      {
        statement: "Containers package applications with their dependencies for consistent execution across environments.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "packaging"],
      },
      {
        statement: "Docker images are read-only templates used to create containers.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "images", "containers"],
      },
      {
        statement: "Docker containers are running instances of images that provide isolated execution environments.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "execution"],
      },
      
      // Installation and Setup
      {
        statement: "Docker Desktop provides a native application for Mac and Windows with all Docker tools included.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "installation", "docker-desktop"],
      },
      {
        statement: "Docker can be installed on Linux using package managers like apt, yum, or dnf.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "installation", "linux"],
      },
      {
        statement: "Docker version command verifies installation and displays Docker version information.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "installation", "verification"],
      },
      
      // Docker Architecture
      {
        statement: "Docker uses client-server architecture where the Docker client communicates with the Docker daemon.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "architecture", "client-server"],
      },
      {
        statement: "The Docker daemon handles building, running, and distributing Docker containers.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "daemon", "architecture"],
      },
      {
        statement: "Docker client and daemon communicate using REST API over UNIX sockets or network interfaces.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "architecture", "api"],
      },
      
      // Container vs VM
      {
        statement: "Containers share the host OS kernel while virtual machines have their own OS kernel.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "containers", "virtual-machines"],
      },
      {
        statement: "Containers are more lightweight than virtual machines due to shared kernel and reduced overhead.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "containers", "performance"],
      },
      {
        statement: "Containers start faster than virtual machines because they don't require OS boot time.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "containers", "performance"],
      },
      
      // Dockerfile
      {
        statement: "Dockerfile defines the steps to build a Docker image using declarative instructions.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "dockerfile", "images"],
      },
      {
        statement: "Docker FROM instruction sets the base image for subsequent instructions.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "dockerfile", "instructions"],
      },
      {
        statement: "Docker RUN instruction executes commands during image build.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "dockerfile", "instructions"],
      },
      {
        statement: "Docker COPY instruction copies files from host to the image during build.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "dockerfile", "instructions"],
      },
      {
        statement: "Docker EXPOSE instruction documents which port the container listens on.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "dockerfile", "instructions"],
      },
      {
        statement: "Docker CMD instruction sets the default command to run when starting a container.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "dockerfile", "instructions"],
      },
      {
        statement: "Docker ENTRYPOINT instruction configures a container to run as an executable.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "dockerfile", "instructions"],
      },
      {
        statement: "Docker ENV instruction sets environment variables for the container.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "dockerfile", "environment"],
      },
      
      // Container Lifecycle
      {
        statement: "Docker run command creates and starts a new container from an image.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "lifecycle"],
      },
      {
        statement: "Docker ps command lists running containers.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "commands"],
      },
      {
        statement: "Docker stop command gracefully stops a running container.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "lifecycle"],
      },
      {
        statement: "Docker start command starts a stopped container.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "lifecycle"],
      },
      {
        statement: "Docker restart command stops and starts a container.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "lifecycle"],
      },
      {
        statement: "Docker rm command removes a stopped container.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "lifecycle"],
      },
      {
        statement: "Docker logs command displays container logs for troubleshooting.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "logs"],
      },
      {
        statement: "Docker exec command runs commands inside a running container.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "containers", "commands"],
      },
      
      // Docker Hub
      {
        statement: "Docker Hub is a registry for sharing and distributing Docker images.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "docker-hub", "registry"],
      },
      {
        statement: "Docker pull command downloads images from Docker Hub or other registries.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "images", "docker-hub"],
      },
      {
        statement: "Docker push command uploads images to Docker Hub or other registries.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "images", "docker-hub"],
      },
      {
        statement: "Docker search command searches Docker Hub for available images.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "images", "docker-hub"],
      },
      
      // Docker Compose
      {
        statement: "Docker Compose defines and manages multi-container applications using YAML configuration.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "docker-compose", "orchestration"],
      },
      {
        statement: "Docker Compose up command creates and starts services defined in docker-compose.yml.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "docker-compose", "commands"],
      },
      {
        statement: "Docker Compose down command stops and removes containers, networks, and volumes.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "docker-compose", "commands"],
      },
      
      // Docker Volumes
      {
        statement: "Docker volumes persist data between container restarts and removal.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "volumes", "storage"],
      },
      {
        statement: "Docker volume create command creates a named volume for data persistence.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "volumes", "commands"],
      },
      {
        statement: "Docker volume ls command lists all volumes.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "volumes", "commands"],
      },
      
      // Docker Networking
      {
        statement: "Docker provides networking capabilities for containers to communicate with each other.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "networking", "communication"],
      },
      {
        statement: "Docker network create command creates a user-defined network.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "networking", "commands"],
      },
      {
        statement: "Docker network connect command connects a container to a network.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "networking", "commands"],
      },
      
      // Security
      {
        statement: "Running containers as root creates security vulnerabilities and should be avoided in production.",
        fact_type: "rule",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "security", "best-practices"],
      },
      {
        statement: "Docker uses namespaces to provide isolated workspaces for containers.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "security", "namespaces"],
      },
      {
        statement: "Docker uses cgroups to limit and isolate resource usage for containers.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "security", "cgroups"],
      },
      
      // Benefits
      {
        statement: "Docker enables consistent application behavior across development, testing, and production environments.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "benefits", "consistency"],
      },
      {
        statement: "Docker accelerates development by eliminating environment setup time and dependencies.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "benefits", "productivity"],
      },
      {
        statement: "Docker supports microservices architecture by isolating services in separate containers.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["docker", "benefits", "microservices"],
      },
      
      // Common Commands
      {
        statement: "Docker build command builds an image from a Dockerfile.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "images", "commands"],
      },
      {
        statement: "Docker images command lists all locally stored images.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "images", "commands"],
      },
      {
        statement: "Docker rmi command removes one or more images.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["docker", "images", "commands"],
      },
    ],
  };

  try {
    const response = await fetch(`${BASE_URL}/api/admin/improve-knowledge-package`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
        topic_id: "42dde06e-ee36-4169-b164-650b5bf7b0a1",
        improvements,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log("=== IMPROVEMENT COMPLETE ===\n");
    console.log(`Facts added: ${data.facts_added}`);
    console.log(`Message: ${data.message}`);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

improveDockerContainers();
