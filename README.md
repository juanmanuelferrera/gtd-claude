# ⚡ HyperFiler Pro - v4.4.2 🚀

<div align="center">

![Version](https://img.shields.io/badge/version-4.4.2-blue)
![Status](https://img.shields.io/badge/status-active-success)
![PWA](https://img.shields.io/badge/PWA-ready-brightgreen)
![GTD](https://img.shields.io/badge/GTD-powered-orange)

**The Ultimate GTD Task Management System for Digital Professionals**

[🚀 Launch App](https://hyperfiler.pro/hyperfiler-pro.html) | [📖 Documentation](https://hyperfiler.pro) | [🌍 Español](https://hyperfiler.pro/index-es.html)

</div>

---

## 🎯 What is HyperFiler Pro?

HyperFiler Pro is a **revolutionary task management system** that combines the proven **Getting Things Done (GTD)** methodology with cutting-edge web technology. Built for professionals who demand **speed**, **reliability**, and **intelligent organization**, it transforms chaotic task lists into a streamlined productivity engine.

### 🏆 Why Choose HyperFiler Pro?

- **⚡ Lightning Fast**: Zero-latency interface with instant response times
- **📱 Works Everywhere**: Progressive Web App runs on any device, online or offline
- **🧠 GTD-Native**: Built from the ground up for Getting Things Done methodology
- **🔒 100% Private**: Your data never leaves your control
- **🚀 No Installation**: Access instantly from any browser

## ✨ Revolutionary Features

### 🎮 Intelligent Task Management
- **Smart Capture**: Natural language processing for instant task creation
- **Bulk Operations**: Select and manage hundreds of tasks simultaneously
- **iOS-Style Date Picker**: Frictionless scheduling with native-feeling controls
- **Gesture Controls**: Swipe to reschedule, tap to complete
- **Auto-Migration**: Overdue tasks intelligently move to today

### 📊 GTD Weekly Review System
- **Event Tracking**: Separate important events from actionable tasks
- **Smart Grouping**: Automatic organization by date and project
- **Export Everything**: Generate reports in multiple formats
- **Progress Analytics**: Visual insights into productivity patterns

### 🖼️ Multi-Perspective Views
| View | Purpose | Key Feature |
|------|---------|-------------|
| **Today** | Daily execution | Time-blocked schedule |
| **Week** | 7-day planning | Drag-and-drop rescheduling |
| **Month** | Project overview | Milestone tracking |
| **All Tasks** | Complete management | Advanced filtering |

### 🔮 Advanced Capabilities
- **Template System**: Create reusable project structures with @template tags
- **Real-time Sync**: Instant cloud synchronization across all devices
- **Offline Mode**: Full functionality without internet connection
- **Smart Search**: Find any task in milliseconds
- **Statistics Dashboard**: Comprehensive productivity metrics

## 🤖 MCP Integration (Model Context Protocol)

HyperFiler can be controlled directly from **Claude Code** via MCP, enabling natural language task management from the terminal.

### What You Can Do

```bash
# From Claude Code terminal:
"move all @book tasks to tomorrow"
"show today's schedule"
"create task: call dentist @health due tomorrow 10:00"
"complete all tasks containing 'email'"
```

### Architecture

```
Claude Code
    ↓ (MCP Protocol - stdio)
hf_mcp.py (Python MCP server using FastMCP)
    ↓ (HTTP REST API)
Cloudflare Workers (hyperfiler-api)
    ↓
Cloudflare D1 (SQLite)
```

### MCP Tools Available

| Tool | Description |
|------|-------------|
| `hf_list_tasks` | List tasks with filters (status, date, @project) |
| `hf_create_task` | Create new task with title, notes, date, time |
| `hf_update_task` | Update any task field |
| `hf_complete_task` | Mark task as completed |
| `hf_delete_task` | Delete a task |
| `hf_search_tasks` | Search tasks by text |
| `hf_list_templates` | List all @project tags |

### Smart Auto-Scheduling

- **Cron job at 1am**: Automatically organizes daily tasks following rules defined in a prompt
- **Protected time blocks**: Certain slots are fixed (spiritual program 6-7am, lunch at 14:00, etc.)
- **Priority rules**: @health first, legal deadlines before household chores, etc.
- **On-demand organizing**: Run `/organize` skill anytime from terminal
- Tasks are built around protected blocks — you then do final adjustments, but with all rules applied it's just a matter of easy decisions

### Setup MCP Server

```bash
cd mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install mcp fastmcp

# Configure in .mcp.json:
{
  "mcpServers": {
    "hyperfiler": {
      "command": "/path/to/mcp-server/.venv/bin/python3",
      "args": ["/path/to/mcp-server/hf_mcp.py"]
    }
  }
}
```

## 🚀 Version 2.0 - What's New

### 🌟 Major Updates
- **🔄 Progressive Web App**: Install as native app on any device
- **💾 Offline Support**: Complete functionality without internet
- **🎨 Modern UI**: Completely redesigned interface
- **⚡ Performance**: 3x faster load times
- **📱 Mobile First**: Touch-optimized for smartphones

### 🛠️ Technical Improvements
- Service Worker implementation for offline caching
- App Shell architecture for instant loading
- Network status detection and queue management
- Optimized database queries
- Enhanced security measures

## 💡 GTD Methodology Excellence

HyperFiler Pro perfectly implements David Allen's five-step workflow:

```
CAPTURE → CLARIFY → ORGANIZE → REFLECT → ENGAGE
   ↓         ↓          ↓          ↓         ↓
Quick    Template    Multi-    Weekly    Priority
Entry    Projects    Views     Review    Focus
```

### 🎯 Core GTD Principles
- **Mind Like Water**: Stay calm and responsive to any situation
- **Next Actions**: Always know your immediate next step
- **Contexts**: Organize by location, tool, or energy level
- **Projects**: Track multi-step outcomes systematically
- **Someday/Maybe**: Capture ideas without commitment

## 🛠️ Technology Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Vanilla JS, HTML5, CSS3 | Zero-dependency performance |
| **Backend** | Cloudflare Workers | Edge computing speed |
| **Database** | Cloudflare D1 (SQLite) | Distributed data storage |
| **Hosting** | Cloudflare Pages | Global CDN delivery |
| **PWA** | Service Workers | Offline functionality |
| **MCP** | Python + FastMCP | Claude Code integration |

</div>

## 🚀 Quick Start

### Option 1: Web App (Instant)
```
1. Visit https://hyperfiler.pro
2. Click "Launch App"
3. Start organizing!
```

### Option 2: Install PWA
```
1. Open https://hyperfiler.pro in Chrome/Edge
2. Click "Install" in address bar
3. Launch from your apps menu
```

### Option 3: Self-Host
```bash
git clone https://github.com/juanmanuelferrera/hyperfiler
cd hyperfiler
wrangler pages deploy . --project-name=hyperfiler
```

## 📖 Documentation

### 🌍 Available Languages
- 🇬🇧 **English**: [Full Documentation](https://hyperfiler.pro)
- 🇪🇸 **Español**: [Documentación Completa](https://hyperfiler.pro/index-es.html)

### 📚 Quick Links
- [Getting Started Guide](https://hyperfiler.pro#getting-started)
- [GTD Methodology](https://hyperfiler.pro#gtd-methodology)
- [Keyboard Shortcuts](https://hyperfiler.pro#shortcuts)
- [API Documentation](https://hyperfiler.pro#api)

## 🔒 Privacy & Security

### 🛡️ Your Data is Sacred
- **Zero Tracking**: No analytics, no cookies, no surveillance
- **Client-Side Encryption**: Optional end-to-end encryption
- **Local First**: Data stored locally with optional sync
- **Open Source**: Fully auditable codebase
- **GDPR Compliant**: Complete data ownership and portability

## 🤝 Contributing

We welcome contributions that enhance the GTD experience:

### 🎯 Contribution Areas
- **Feature Development**: New GTD-aligned capabilities
- **Performance**: Speed and efficiency improvements
- **Localization**: Translate to new languages
- **Documentation**: Improve guides and tutorials
- **Bug Fixes**: Help us maintain quality

### 🚀 Development Setup
```bash
# Clone repository
git clone https://github.com/juanmanuelferrera/hyperfiler

# Install dependencies
npm install

# Start development server
wrangler dev

# Deploy
wrangler pages deploy . --project-name=hyperfiler
```

## 📊 Performance Metrics

| Metric | Score | Target |
|--------|-------|--------|
| **Lighthouse Score** | 98/100 | >95 |
| **First Paint** | 0.8s | <1s |
| **Time to Interactive** | 1.2s | <2s |
| **Offline Ready** | 100% | 100% |
| **Mobile Score** | 99/100 | >95 |

## 🗺️ Roadmap

### Completed
- [x] MCP integration for Claude Code control
- [x] Auto-scheduling cron with smart rules
- [x] Protected time blocks system
- [x] Priority-based task organization

### Planned
- [ ] Calendar integration (Google, Apple)
- [ ] Email capture
- [ ] Org-mode export/import
- [ ] API webhooks

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

<div align="center">

### 💭 The GTD Philosophy

**"Your mind is for having ideas, not holding them."**  
*— David Allen, Creator of Getting Things Done*

---

**Built with ❤️ for productivity enthusiasts worldwide**

[🚀 Start Your GTD Journey](https://hyperfiler.pro/hyperfiler-pro.html) | [⭐ Star on GitHub](https://github.com/juanmanuelferrera/hyperfiler)

</div>