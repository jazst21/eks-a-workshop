## 1. cloud9 on default vpc
## 2. install terraform, create host vm using terraform
--terraform--  
https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli  
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common  
wget -O- https://apt.releases.hashicorp.com/gpg | \
gpg --dearmor | \
sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
gpg --no-default-keyring \
--keyring /usr/share/keyrings/hashicorp-archive-keyring.gpg \
--fingerprint
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update
sudo apt-get install terraform
terraform plan
terraform apply
--- ubuntu--- 1. login to host, install docker, eksctl tool  
sudo su
sscreen -ls
screen -r
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done
//Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

//Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker run hello-world
---eksctl---
curl "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" \
    --silent --location \
    | tar xz -C /tmp
install -m 0755 /tmp/eksctl /usr/local/bin/eksctl
---eksctlPackages---
RELEASE_VERSION=$(curl https://anywhere-assets.eks.amazonaws.com/releases/eks-a/manifest.yaml --silent --location | yq ".spec.latestVersion")
EKS_ANYWHERE_TARBALL_URL=$(curl https://anywhere-assets.eks.amazonaws.com/releases/eks-a/manifest.yaml --silent --location | yq ".spec.releases[] | select(.version==\"$RELEASE_VERSION\").eksABinary.$(uname -s | tr A-Z a-z).uri")
curl $EKS_ANYWHERE_TARBALL_URL \
    --silent --location \
    | tar xz ./eksctl-anywhere
sudo install -m 0755 ./eksctl-anywhere /usr/local/bin/eksctl-anywhere
---kubectl---
export OS="$(uname -s | tr A-Z a-z)" ARCH=$(test "$(uname -m)" = 'x86_64' && echo 'amd64' || echo 'arm64')
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/${OS}/${ARCH}/kubectl"
install -m 0755 ./kubectl /usr/local/bin/kubectl
---modify OS
docker info | grep Cgroup
vi /etc/default/grub
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"
update-grub
reboot now
docker info | grep Cgroup
vi /etc/sysctl.conf
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512
//macos
sudo sysctl -w kern.maxfiles=524288
---clusterconfig---
CLUSTER_NAME=mgmt
eksctl anywhere generate clusterconfig $CLUSTER_NAME \
   --provider docker > $CLUSTER_NAME.yaml
---createCluster---
eksctl anywhere create cluster -f $CLUSTER_NAME.yaml
--- connect eks-a
CLUSTER_NAME=mgmt
export KUBECONFIG=${PWD}/${CLUSTER_NAME}/${CLUSTER_NAME}-eks-a-cluster.kubeconfig
kubectl get ns
---local access
//copy kubeconfig file to local
add insecure-skip-tls-verify: true
kubectl config set-cluster  mgmt --server=http://54.86.12.105:32769
kubectl config use-context mgmt
kubectl config view
export KUBECONFIG=/Users/pugarjay/git/work/eks-a/eks-a-workshop/config
kubectl get all
---Deploy test workload, duplicate tab and login
sudo su
kubectl apply -f "https://anywhere.eks.amazonaws.com/manifests/hello-eks-a.yaml"
curl -LO "https://anywhere.eks.amazonaws.com/manifests/hello-eks-a.yaml"
kubectl apply -f "https://anywhere.eks.amazonaws.com/manifests/hello-eks-a.yaml"
kubectl get pods -l app=hello-eks-a
kubectl logs -l app=hello-eks-a
kubectl port-forward deploy/hello-eks-a 8000:80
curl localhost:8000
kubectl get deploy/hello-eks-a -o yaml > hello-eks-a.yaml
---from internet
open port 32768 for kubernetes, because we dont have BGP router speaker for metalLB
---helm
sudo su
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
./get_helm.sh
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo list
helm install apache bitnami/apache --set service.type=NodePort
export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services apache)
export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
echo http://$NODE_IP:$NODE_PORT/
curl http://172.18.0.5:31994/
kubectl port-forward service/apache 8000:80 --insecure-skip-tls-verify=true
---curated packages
https://anywhere.eks.amazonaws.com/docs/packages/prereq/
eksctl anywhere list packages --kube-version 1.28
kubectl get all -A
export CLUSTER_NAME=mgmt
eksctl anywhere generate package harbor --cluster ${CLUSTER_NAME} --kube-version 1.28 > harbor-spec.yaml
cat harbor-spec.yaml

---MetalLB Configuration






---troubleshoot---
//delete cluster
docker ps | grep "${CLUSTER_NAME}-eks-a-cluster-control-plane" | awk '{ print $1 }' | xargs docker rm -f
//add context to kubectl
kubectl config view
sudo kubectl config set-context mgmt-admin@mgmt --namespace=default --cluster=mgmt --user=mgmt-admin
sudo kubectl config use-context mgmt-admin@mgmt
kubectl config set-cluster mgmt
--proxy-url=my-proxy-url
kubectl config get-contexts
----
1. download necessary packages
2. generate cluster config, install cluster
3. install packages
