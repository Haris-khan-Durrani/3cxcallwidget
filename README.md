<div align="center">
  
  <img src="assets/hero_banner.png" alt="3CX Call Widget Hero Banner" width="100%" />

  <h1>3CX Call Widget Builder</h1>

  <p>
    <strong>A modern, powerful, and fully customizable Web Call Widget generator for your 3CX Phone System.</strong>
  </p>

  <p>
    <a href="https://github.com/Haris-khan-Durrani/3cxcallwidget/commits/main"><img src="https://img.shields.io/github/last-commit/Haris-khan-Durrani/3cxcallwidget?style=for-the-badge&color=0b4526" alt="Last Commit" /></a>
    <a href="https://github.com/Haris-khan-Durrani/3cxcallwidget/issues"><img src="https://img.shields.io/github/issues/Haris-khan-Durrani/3cxcallwidget?style=for-the-badge&color=blue" alt="Issues" /></a>
    <a href="https://github.com/Haris-khan-Durrani/3cxcallwidget/stargazers"><img src="https://img.shields.io/github/stars/Haris-khan-Durrani/3cxcallwidget?style=for-the-badge&color=ffb800" alt="Stars" /></a>
    <a href="https://hub.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Ready" /></a>
  </p>
</div>

<br />

## 🌟 Overview

The **3CX Call Widget Builder** is an enterprise-grade SaaS application that empowers businesses to create beautifully designed, fully functional Web Call Widgets tailored for their 3CX PBX systems. With a modern, intuitive visual builder, you can customize every pixel—from colors and typography to popup styles, tooltip animations, and agent avatars—without writing a single line of code!

Designed with SEO, performance, and user experience at its core, this application provides a seamlessly generated script that you can drop straight into any website, enabling frictionless communication between your website visitors and your support teams.

---

## ✨ Key Features

- 🎨 **Visual Builder UI**: Real-time interactive widget builder packed with premium customization options.
- 💅 **Rich Aesthetics**: Over 30 configurable styling properties including gradients, glassmorphism, avatars, shapes, colors, and responsive positioning.
- 📱 **100% Mobile Responsive**: Perfectly scales and adapts from ultra-wide desktops to mobile screens.
- ⚡ **Dynamic Micro-Animations**: Smooth tooltip auto-hiding, floating button pulses, and state-driven visual feedback for users.
- ⚙️ **Advanced 3CX Integrations**: Connect seamlessly using FQDN, Client IDs, and API extensions natively.
- 🏢 **Office Hours Management**: Intelligent routing that hides or modifies widget behavior based on timezone-aware business hours.
- 🐳 **Docker Native Deployment**: Deploy anywhere instantly with our out-of-the-box Docker multi-stage environment.

---

## 🚀 Quick Start (Docker Installation)

Deploying the **3CX Call Widget Builder** is incredibly straightforward using Docker. We've bundled the full-stack Vue.js application, Express API, and a MySQL instance into a single `docker-compose.yml` file.

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) available.

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Haris-khan-Durrani/3cxcallwidget.git
   cd 3cxcallwidget
   ```

2. **Spin up the Environment**
   Run the following command to automatically pull, build, and start the frontend, backend, and database in the background:
   ```bash
   docker-compose up -d --build
   ```

3. **Access the Application**
   Open your browser and navigate to:
   [http://localhost:3005/admin](http://localhost:3005/admin)

---

## 🛠️ Tech Stack

- **Frontend Builder**: Vue 3 (Composition API), Vite, Pinia (State Management), Vanilla CSS.
- **Backend API**: Node.js, Express.js.
- **Database**: MySQL 8.0, Sequelize ORM.
- **Widget Core**: Vanilla JS Template Engine mapping real-time API configs to DOM instances.
- **Containerization**: Docker, Docker Compose, Multi-stage Alpine images.

---

## 📝 Usage Guide

1. Log into the `/admin` dashboard.
2. Click **Create New Widget**.
3. Use the **Left Navigation Panel** to traverse styling, functionality, routing, and office hours options.
4. Preview the changes in real-time in the central workspace.
5. Click **Save** and grab the generated `<script>` tag.
6. Drop the script onto any HTML/React/WordPress site.

---

## 🤝 Contributing

Contributions, issues, and feature requests are always welcome!  
Feel free to check out the [issues page](https://github.com/Haris-khan-Durrani/3cxcallwidget/issues) to see how you can help.

<div align="center">
  <br/>
  <i>Built with passion to redefine communication styling.</i>
</div>
