---
name: system-info
description: Get system information including OS, hardware, processes, network, disk, battery, and performance details.
platform: cross-platform
---

# System Info

Use standard CLI tools to retrieve system and hardware information.

## When to use

Use this skill when the user asks about their system, OS version, CPU, memory, disk space, network, battery, running processes, or performance metrics.

## OS and Hardware

Basic OS info:

```bash
uname -a
```

macOS version:

```bash
sw_vers
```

CPU info:

```bash
sysctl -n machdep.cpu.brand_string
sysctl -n hw.ncpu
```

Memory (macOS):

```bash
sysctl -n hw.memsize | awk '{print $1/1024/1024/1024 " GB"}'
```

System overview (macOS):

```bash
system_profiler SPSoftwareDataType SPHardwareDataType 2>/dev/null | head -30
```

## Processes

List all processes (sorted by CPU):

```bash
ps aux --sort=-%cpu | head -20
```

Top memory consumers:

```bash
ps aux --sort=-%mem | head -20
```

Find a specific process:

```bash
pgrep -fl "process_name"
```

Kill a process:

```bash
kill -9 <pid>
```

## Disk

Disk usage overview:

```bash
df -h
```

Largest files in a directory:

```bash
du -sh * | sort -rh | head -20
```

## Network

IP address:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Public IP:

```bash
curl -s ifconfig.me
```

Open ports:

```bash
lsof -i -P -n | grep LISTEN
```

DNS lookup:

```bash
nslookup example.com
```

Network speed test (if `speedtest-cli` installed):

```bash
speedtest-cli --simple
```

## Battery (macOS)

```bash
pmset -g batt
```

## Environment

List environment variables:

```bash
env | sort
```

Specific variable:

```bash
echo $PATH
echo $HOME
```

## Tips

- On macOS, use `system_profiler` for detailed hardware info.
- Use `htop` (if installed) for interactive process monitoring.
- `lsof -i :8080` to find what's using a specific port.
- `uptime` to check system load and uptime.
