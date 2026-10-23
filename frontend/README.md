# 🌊 Aqua Sonar Network Security System (ASNSS)

### AI-Assisted Underwater Monitoring and Network Security

ASNSS is an underwater monitoring and security project designed to collect sensor telemetry, monitor underwater node health, visualize sensor readings, and help identify unusual underwater activity.

The system combines an ESP32-based hardware node, sensor telemetry, a FastAPI backend, and a React-based monitoring dashboard.

> **Development status:** This project is under active development. Sensor detection, underwater operation, AI-based classification, and alert accuracy depend on hardware integration, validated sensor data, and future implementation.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Objectives](#-objectives)
- [System Architecture](#-system-architecture)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Hardware Requirements](#-hardware-requirements)
- [Getting Started](#-getting-started)
- [Backend Setup](#-backend-setup)
- [Frontend Setup](#-frontend-setup)
- [API Endpoints](#-api-endpoints)
- [Telemetry Format](#-telemetry-format)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Future Scope](#-future-scope)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

Underwater environments present challenges for conventional monitoring systems because radio communication, environmental conditions, and sensor deployment can limit connectivity and visibility.

ASNSS aims to provide a modular monitoring platform that collects telemetry from underwater monitoring nodes and displays available measurements through a centralized dashboard.

The current software architecture supports telemetry ingestion, historical readings, node monitoring, and visualization. Sonar measurements depend on the sensor interface, firmware, and backend integration.

---

## 🎯 Objectives

- Collect telemetry from ESP32-based monitoring nodes.
- Monitor temperature and network signal strength.
- Integrate an ultrasonic or sonar sensor for range measurements.
- Visualize telemetry through interactive charts and statistics.
- Maintain historical telemetry for analysis.
- Monitor node connectivity and system health.
- Develop an extensible foundation for underwater activity detection.
- Explore machine-learning-based anomaly detection as a future enhancement.

---

## 🏗️ System Architecture

```text
             SENSOR / UNDERWATER NODE
                       |
          +------------+------------+
          |            |            |
       ESP32       Temperature    Sonar Sensor
          |           Sensor          |
          +------------+--------------+
                       |
                Telemetry Payload
                       |
                Wi-Fi / Network
                       |
                       v
                FASTAPI BACKEND
                       |
          +------------+-------------+
          |            |             |
      Telemetry      History       WebSocket
       Endpoint      Endpoint      Interfaces
          |            |             |
          +------------+-------------+
                       |
                       v
                REACT FRONTEND
                       |
          +------------+-------------+
          |            |             |
       Dashboard    Analytics       Alerts
          |            |             |
       Node View    Live Charts    Event View