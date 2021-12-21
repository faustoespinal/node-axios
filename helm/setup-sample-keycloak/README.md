
# setup-sample-keycloak

## Overview
Runs the node-axios image in a kubernetes job

```bash
# Testing configuration
$ helm repo add ehs https://cp-nexus-0.novalocal
$ helm install my-setup-sample-keycloak ehs/setup-sample-keycloak
```

```bash
# Production configuration
$ helm repo add ehs https://charts.bitnami.com/bitnami
$ helm install my-setup-sample-keycloak ehs/setup-sample-keycloak --values additional_values.yaml
```

## Introduction

This chart bootstraps a [setup-sample-keycloak](https://github.com/setup-sample-keycloak) deployment on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

Helm boot charts can be used with [Kubeapps](https://kubeapps.com/) for deployment and management of Helm Charts in clusters.


## Prerequisites

- Kubernetes 1.12+
- Helm 3.0+
- PV provisioner support in the underlying infrastructure

## Installing the Chart

To install the chart with the release name "my-release":

```bash
$ helm install my-setup-sample-keycloak ehs/setup-sample-keycloak
```

The command deploys setup-sample-keycloak on the Kubernetes cluster in the default configuration. The [Parameters](#parameters) section lists the parameters that can be configured during installation.

> **Tip**: List all releases using "helm list"

## Uninstalling the Chart

To uninstall/delete the "my-setup-sample-keycloak" deployment:

```bash
$ helm delete my-setup-sample-keycloak
```

The command removes all the Kubernetes components associated with the chart and deletes the release.

## Parameters

The following table lists the configurable parameters of the Redis chart and their default values.


| Parameter                                     | Description                                                                                                                                         | Default                                                 |
|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| global.imageRegistry                        | Global Docker image registry                                                                                                                        | "nil"                                                   |
| global.imagePullSecrets                     | Global Docker registry secret names as an array                                                                                                     | [] (does not add image pull secrets to deployed pods) |
| global.storageClass                         | Global storage class for dynamic provisioning                                                                                                       | "nil"                                                   |
| global.redis.password                       | Redis password (overrides password)                                                                                                               | "nil"                                                   |
| pullPolicy | Defaults to 'Always' if image tag is 'latest', else set to 'IfNotPresent' (ref: http://kubernetes.io/docs/user-guide/images/#pre-pulling-images) | IfNotPresent |
| registry | Registry locator for the helm docker images | nul |
| containerSecurityContext.enabled | Whether to enable settings enforcing container security context | true |
| containerSecurityContext.runAsUser | The id of the user to use when running under a security context | 1001 |
| serviceAccount.create | Whether to create a service account for this helm deployment | false |
| serviceAccount.name | The name of the ServiceAccount to use. If not set and create is true, a name is generated using the fullname template | nul |
| livenessProbe.enabled | Whether to enable liveness probe on container | true |
| livenessProbe.initialDelaySeconds | Number of seconds after the container has started before liveness or readiness probes are initiated. Defaults to 0 seconds. Minimum value is 0. | 30 |
| livenessProbe.periodSeconds | How often (in seconds) to perform the probe. Default to 10 seconds. Minimum value is 1. | 10 |
| livenessProbe.timeoutSeconds | Number of seconds after which the probe times out. Defaults to 1 second. Minimum value is 1. | 5 |
| livenessProbe.successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. Defaults to 1. Must be 1 for liveness and startup Probes. Minimum value is 1. | 1 |
| livenessProbe.failureThreshold | When a probe fails, Kubernetes will try failureThreshold times before giving up. Giving up in case of liveness probe means restarting the container. In case of readiness probe the Pod will be marked Unready. Defaults to 3. Minimum value is 1. | 5 |
| readinessProbe.enabled | Whether to enable liveness probe on container | true |
| readinessProbe.initialDelaySeconds | Number of seconds after the container has started before liveness or readiness probes are initiated. Defaults to 0 seconds. Minimum value is 0. | 30 |
| readinessProbe.periodSeconds | How often (in seconds) to perform the probe. Default to 10 seconds. Minimum value is 1. | 10 |
| readinessProbe.timeoutSeconds | Number of seconds after which the probe times out. Defaults to 1 second. Minimum value is 1. | 5 |
| readinessProbe.successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. Defaults to 1. Must be 1 for liveness and startup Probes. Minimum value is 1. | 1 |
| readinessProbe.failureThreshold | When a probe fails, Kubernetes will try failureThreshold times before giving up. Giving up in case of liveness probe means restarting the container. In case of readiness probe the Pod will be marked Unready. Defaults to 3. Minimum value is 1. | 5 |
| sdtup-sample-keycloak.image.repository | Container image repository | nul |
| sdtup-sample-keycloak.image.tag | Version tag of the container image for the sdtup-sample-keycloak. | nul |
| sdtup-sample-keycloak.affinity | Affinity for pod assignment (https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity | {} |
| sdtup-sample-keycloak.nodeSelector | Node labels for pod assignment (https://kubernetes.io/docs/user-guide/node-selection/) | {} |
| sdtup-sample-keycloak.tolerations | Tolerations for pod assignment (https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) | {} |
| sdtup-sample-keycloak.resources | sdtup-sample-keycloak pods' resource requests and limits | {} |


Specify each parameter using the "--set key=value[,key=value]" argument to "helm install". For example,

```bash
$ helm install my-setup-sample-keycloak --set setup-sample-keycloak.key="thevalue" ehs/setup-sample-keycloak
```

The above command sets the release setup-sample-keycloak helm chart value setup-sample-keycloak.key to "thevalue".

Alternatively, a YAML file that specifies the values for the parameters can be provided while installing the chart. For example,

```bash
$ helm install my-setup-sample-keycloak -f values.yaml ehs/setup-sample-keycloak
```