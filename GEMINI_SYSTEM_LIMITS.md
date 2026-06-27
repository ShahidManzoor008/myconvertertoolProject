# GEMINI SYSTEM ENVIRONMENT & RESOURCE LIMITS

## System Information

Environment:
- Oracle Cloud Ubuntu VM
- Ubuntu Linux Server
- 2 vCPU
- ~1 GB RAM
- 8 GB+ Swap
- Low-resource environment

Current Hardware Constraints:
- Total RAM: ~954 MiB
- Available RAM is limited
- Swap usage can increase quickly during builds
- CPU resources are limited
- Disk I/O becomes slow under memory pressure

---

# CRITICAL OPERATION RULES

## Memory Awareness

This system is LOW MEMORY.

Avoid:
- large in-memory operations
- loading large datasets
- recursive file scanning
- indexing entire repositories
- parallel builds
- parallel AI tasks
- heavy transpilation pipelines
- memory-heavy bundlers

Preferred behavior:
- stream processing
- chunked operations
- incremental builds
- single-task execution
- lightweight dependencies
- memory-efficient tooling

---

# NODE.JS LIMITS

Always assume Node.js memory is constrained.

Use:
```bash
export NODE_OPTIONS="--max-old-space-size=512"
