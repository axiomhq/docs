<div class="axi-header">
  <h1>Ingest using Elastic Beats</h1>
</div>

[Elasticbeats](https://www.elastic.co/beats/) serves as a lightweight platform for data shippers that transfer information from the source to axiom and other tools based on the configuration. Before shipping data, beats collects metrics and logs from different sources, which later are deployed to your Axiom deployments.

There are different [Elastic Beats](https://www.elastic.co/beats/) you could use to ship logs and Axioms documentation provides a detailed step by step procedure on how to use each Beats.


## Filebeat

[Filebeat](https://www.elastic.co/beats/filebeat) is a lightweight shipper for logs, it helps you centralize logs, files and can read files from your system.

Filebeats is useful for workloads, system, application log files, and data logs you would like to ingest to Axiom in some way.

In the logging case, it helps centralize logs and files in a structured pattern by reading from your various applications, services, workloads and VMs, then shipping to your Axiom deployments.

### **Installation**

Visit the [Filebeat OSS download page](https://www.elastic.co/downloads/beats/filebeat-oss) to install Filebeat. For more information, check out Filebeat's [official documentation](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)

**When downloading Filebeats, install the OSS version being that the non-oss version doesn't work with Axiom**

### **Configuration**

Axiom lets you ingest data with the ElasticSearch bulk ingest API.

In order for Filebeat to work, index lifecycle management (ILM) must be disabled. To do so, **add setup.ilm.enabled: false** to the filebeat.yml configuration file.

=== "Yaml"

```yaml
setup.ilm.enabled: false
filebeat.inputs:
  - type: log
    # Specify the path of the system log files to be sent to Axiom deployment. 
    paths: 
      - $PATH_TO_LOG_FILE
output.elasticsearch:
  # using the specified Axiom API
  hosts: ["$YOUR_AXIOM_URL:443/api/v1/datasets/<my-datasets>/elastic"]
  # api_key can be your ingest or personal token
  api_key: "user:token"
```

## Metricbeat

[Metricbeat](https://www.elastic.co/beats/metricbeat) is a lightweight shipper for metrics.

Metricbeat is installed on your systems and services and used for monitoring their performance, as well as different remote packages/utilities running on them.

### **Installation**

Visit the [MetricBeat OSS download page](https://www.elastic.co/downloads/beats/metricbeat-oss) to install Metricbeat. For more information, check out Metricbeat's [official documentation](https://www.elastic.co/guide/en/beats/metricbeat/current/index.html)

### **Configuration**

=== "Yaml"

```yaml
metricbeat.modules:
setup.ilm.enabled: false
metricbeat.config.modules:
  path:
    -$PATH_TO_LOG_FILE 
metricbeat.modules:
- module: system 
  metricsets: 
    - filesystem
    - cpu
    - load
    - fsstat
    - memory
    - network
output.elasticsearch:
  hosts: ["$YOUR_AXIOM_URL:443/api/v1/datasets/<dataset>/elastic"]
  # api_key can be your ingest or personal token
  api_key:  "user:token"
```

## Winlogbeat  

[Winlogbeat](https://www.elastic.co/guide/en/beats/winlogbeat/current/index.html) is an open-source Windows specific event-log shipper that is installed as a Windows service. It can be used to collect and send event logs to **Axiom.**

Winlogbeat reads from one or more event logs using Windows APIs, filters the events based on user-configured criteria, then sends the event data to the configured outputs. 

You can Capture:

- application events
- hardware events
- security events
- system events

### Installation 

Visit the [Winlogbeat download page](https://www.elastic.co/downloads/beats/winlogbeat) to install Winlogbeat. For more information, check out Winlogbeat's [official documentation](https://www.elastic.co/guide/en/beats/winlogbeat/current/winlogbeat-installation-configuration.html)

- Extract the contents of the zip file into C:\Program Files.
- Rename the **winlogbeat-<version>** directory to Winlogbeat
- Open a PowerShell prompt as an Administrator and run 

```shell 
PS C:\Users\Administrator> cd C:\Program Files\Winlogbeat

PS C:\Program Files\Winlogbeat> .\install-service-winlogbeat.ps1
```

### Configuration

Configuration for Winlogbeat Service is found in the `winlogbeat.yml file in C:\Program Files\Winlogbeat.`

Edit the winlogbeat.yml configuration file found in `C:\Program Files\Winlogbeat` this will let you send data to Axiom.

**What is winlogbeat.yml File?**
The winlogbeat.yml file contains the configuration on which windows events and service it should monitor and the time required.

=== "Yaml"

```yaml
winlogbeat.event_logs:
  - name: Application
  - name: System
  - name: Security
logging.to_files: true
logging.files:
  path: C:\ProgramData\Winlogbeat\Logs
logging.level: info
output.elasticsearch:
  hosts: ["$YOUR_AXIOM_URL:443/api/v1/datasets/<dataset>/elastic"]
  # api_key can be your ingest or personal token
  api_key: "user:token"
```

#### Validate Configuration 

```shell
# Check if your configuration is correct 

PS C:\Program Files\Winlogbeat> .\winlogbeat.exe test config -c .\winlogbeat.yml -e

```

#### Start Winlogbeat 

```shell 
PS C:\Program Files\Winlogbeat> Start-Service winlogbeat
```

You can view the status of your service and control it from the Services management console in Windows. 

To launch the management console, run this command:

```shell 
PS C:\Program Files\Winlogbeat> services.msc
```

#### Stop Winlogbeat 

```shell 
PS C:\Program Files\Winlogbeat> Stop-Service winlogbeat

```


---
**For more information on Winlogbeat event logs visit the [documentation](https://www.elastic.co/guide/en/beats/winlogbeat/current/index.html)**



## Heartbeat

[Heartbeat](https://www.elastic.co/guide/en/beats/heartbeat/current/heartbeat-overview.html)  is a lightweight shipper for uptime monitoring. 

It Monitor your services, and ship response time to **Axiom**. It lets you check periodically check the status of your services and determine whether they are available. 

Heartbeat is useful when you need to verify that you’re meeting your service level agreements for service uptime.

**Heartbeat currently supports monitors for checking hosts via:**

- **ICMP** (v4 and v6) Echo Requests. Use the `icmp monitor` when you simply want to check whether a service is available. This monitor requires root access.
- **TCP** Use the tcp monitor to connect `via TCP.` You can optionally configure this monitor to verify the endpoint by sending and/or receiving a custom payload.
- **HTTP.** Use the http monitor to connect `via HTTP.` You can optionally configure this monitor to verify that the service returns the expected response, such as a specific status code, response header, or content.

### Installation 

Visit the [Heartbeat download page](https://www.elastic.co/guide/en/beats/heartbeat/current/heartbeat-installation-configuration.html#installation) to install Heartbeat on your system. 

### Configuration

Heartbeat provides monitors to check the status of hosts at set intervals. Heartbeat currently provides monitors for ICMP, TCP, and HTTP. 

You configure each monitor individually. In `heartbeat.yml`, specify the list of monitors that you want to enable. Each item in the list begins with a dash (-). 

The example below configures Heartbeat to use three monitors: *an icmp monitor, a tcp monitor, and an http monitor.* deployed instantly to **Axiom**. 

=== "Yaml"

```yaml
setup.ilm.enabled: false
heartbeat.monitors:
- type: icmp
  schedule: '*/5 * * * * * *' 
  hosts: ["myhost"]
  id: my-icmp-service
  name: My ICMP Service
- type: tcp
  schedule: '@every 5s' 
  hosts: ["myhost:12345"]
  mode: any 
  id: my-tcp-service
- type: http
  schedule: '@every 5s'
  urls: ["http://example.net"]
  service.name: apm-service-name 
  id: my-http-service
  name: My HTTP Service
output.elasticsearch:
  hosts: [""$YOUR_AXIOM_URL:443/api/v1/datasets/<dataset>/elastic"]
  # api_key can be your ingest or personal token
  api_key: "user:token"
```

## Auditbeat 

Auditbeat is a lightweight shipper that ships events in real time to **Axiom** for further analysis. It Collects your Linux audit framework data and monitor the integrity of your files. Auditbeat is use to evaluate the activities of users and processes on your systems. 

You can also use Auditbeat to detect changes to critical files, like binaries and configuration files, and identify potential security policy violations.

### Installation 

Vi the [Auditbeat download page](https://www.elastic.co/downloads/beats/auditbeat) to install Auditbeat on your system. 
