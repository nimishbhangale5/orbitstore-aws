# 🛸 OrbitStore — Cloud-Hosted 3-Tier Futuristic Marketplace

![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazon-aws)
![Terraform](https://img.shields.io/badge/IaC-Terraform-purple?logo=terraform)
![Python](https://img.shields.io/badge/Backend-Python-blue?logo=python)
![Docker](https://img.shields.io/badge/Container-Docker-blue?logo=docker)
![CI/CD](https://img.shields.io/badge/CI/CD-GitHub_Actions-green?logo=github-actions)

> A production-grade, cloud-native 3-tier e-commerce platform built entirely on AWS with full CI/CD automation.

---

## 🌐 Live Demo

**Website:** http://orbitstore-website-dev.s3-website-us-east-1.amazonaws.com

---

## 🏗️ Architecture

```
User → S3 (Frontend) → API Gateway → Lambda (Backend) → DynamoDB (Database)

Deployed via: Terraform + AWS CDK
CI/CD: GitHub Actions (Test → Build → Push to ECR → Deploy)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML, CSS, JavaScript — hosted on AWS S3 |
| **Backend** | Python (AWS Lambda) via API Gateway |
| **Database** | AWS DynamoDB (NoSQL) |
| **Container** | Docker + AWS ECR |
| **IaC** | Terraform + AWS CDK |
| **CI/CD** | GitHub Actions |

---

## 📁 Project Structure

```
orbitstore-aws/
├── frontend/               # HTML/CSS/JS (S3 hosted)
├── backend/
│   ├── app.py              # Lambda function (API routes)
│   ├── Dockerfile          # Container definition
│   ├── seed_data.py        # DynamoDB seeder
│   └── tests/              # pytest unit tests
├── infrastructure/
│   ├── terraform/          # All AWS infrastructure as code
│   └── cdk/                # AWS CDK stack
└── .github/workflows/      # CI/CD pipeline
```

---

## 🚀 Features

- ✅ **3-Tier Architecture** — Frontend, Backend, Database fully separated
- ✅ **Serverless Backend** — AWS Lambda + API Gateway (no servers to manage)
- ✅ **NoSQL Database** — DynamoDB with 8 futuristic products
- ✅ **Dockerized** — Backend containerized and pushed to AWS ECR
- ✅ **Infrastructure as Code** — 26 AWS resources managed by Terraform
- ✅ **CI/CD Pipeline** — Auto test, build, and deploy on every git push
- ✅ **Unit Tests** — 4 pytest tests block deployment if they fail

---

## 🔄 CI/CD Pipeline

```
git push → GitHub Actions triggers
              ↓
        🧪 Run Tests (pytest)
              ↓
        🐳 Build Docker Image
              ↓
        📤 Push to AWS ECR
              ↓
        🚀 Deploy Frontend to S3
              ↓
        ⚡ Update Lambda Function
```

---

## 📦 AWS Resources Created

| Service | Purpose |
|---|---|
| S3 Bucket | Frontend static website hosting |
| AWS Lambda | Serverless Python API |
| API Gateway | REST API routes |
| DynamoDB | Products + Orders tables |
| ECR | Docker image registry |
| IAM | Roles and permissions |
| CloudWatch | Logs and monitoring |

---

## 🚀 Deploy It Yourself

```bash
# Clone the repo
git clone https://github.com/nimishbhangale5/orbitstore-aws.git
cd orbitstore-aws

# Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform apply -auto-approve

# Upload frontend
aws s3 sync frontend/ s3://YOUR_BUCKET_NAME/

# Seed database
cd ../../backend
python seed_data.py
```

---

## 💰 Cost

Runs entirely on **AWS Free Tier** — $0/month

---

## 👤 Author

**Nimish Bhangale**
- 📧 bhangalenimish@gmail.com
- 💼 [LinkedIn](https://www.linkedin.com/in/nimish-bhangale-526a42222/)
- 🐙 [GitHub](https://github.com/nimishbhangale5)