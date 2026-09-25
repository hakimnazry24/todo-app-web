# AWS Learning Plan

Learning the AWS services used by the work repo `delivery-infra` by deploying the
ToDo app onto the same services. Covers 16 of delivery-infra's 17 services.

**Status: 6 of 33 steps complete. Next up: step 7 (ECR in Terraform).**

Account `221082178177`, IAM user `hakim-admin`, region `us-west-2`.
On the legacy 12-month free tier, so RDS should be free at step 8.

Built so far (all in `us-west-2`, all $0 until something runs).
Everything below is now managed by Terraform in `hakimnazry24/todo-infra`
(`live/dev/us-west-2`) — the console is for looking, Terraform for changing.

| Resource | Id |
| --- | --- |
| VPC `todo-dev-vpc` | `10.0.0.0/16` |
| Subnet `todo-dev-public-a` | `10.0.1.0/24`, us-west-2a, auto public IP |
| Subnet `todo-dev-public-b` | `10.0.2.0/24`, us-west-2b, auto public IP |
| SG `todo-dev-alb-sg` | :80 from `0.0.0.0/0` |
| SG `todo-dev-ecs-sg` | :80 from alb-sg |
| SG `todo-dev-rds-sg` | :5432 from ecs-sg |

Resource IDs are deliberately NOT recorded here — step 5 proved they change on
every destroy/apply. Run `terraform state list` or query AWS by Name tag.

Terraform state is LOCAL (`live/dev/us-west-2/terraform.tfstate`, gitignored)
until step 32 moves it to S3. Losing that file means Terraform forgets these
resources exist.

ECR repos are `todo/backend` and `todo/frontend`. Images must be built with
`--platform linux/amd64` (Fargate's default) — the Mac is `arm64`. Step 6's
console repos were deleted; step 7 recreates them in Terraform.

No NAT gateway by design — tasks get public IPs in public subnets instead,
saving ~$32/month. `delivery-infra` uses private subnets + NAT; compare
`delivery-infra/modules/vpc` against `todo-infra/modules/vpc` to see the gap.

---

## Working agreement

**Learning loop** — every step that involves code:

1. Claude creates the files and folders, empty or scaffolded only.
2. Claude writes real, working code, then comments all of it out.
3. Hakim types it himself, using the comments as reference.
4. Claude reviews it for syntax, logic and correctness.
5. Claude deletes its commented reference. Next step.

Steps that need no code (console clicks, CLI, IAM setup) get the exact sequence
instead — screen by screen, field by field.

**Repos** — two, never a cross-repo commit:

| Repo | Holds |
| --- | --- |
| `hakimnazry24/todo-app-web` | The ToDo app. App changes commit here. |
| `hakimnazry24/todo-infra` | Terraform. Created at step 4. |

Each has a `docs/` folder. Hakim writes those himself; Claude contributes only
when asked.

**GitHub account** — always `hakimnazry24`, never `hakimnazry-fileai`.
`gh auth setup-git` has been run, so git follows whichever account `gh` has
active. Switching accounts makes pushes to these repos fail with a 403.

**Method** — console first, then the same thing in Terraform, then destroy.

**Cost** — running 24/7 is ~$44/month. Every step ends with teardown; at three
4-hour sessions a week that lands near $3/month. ElastiCache (step 29) is the
expensive single item at ~$12/month while running.

**Sequencing** — infra and app work interleave. When a feature is due, infra
pauses until the feature is finished.

---

## Block A — Account & network

- [x] **1.** 🔧 AWS account: budget alarm, IAM admin + MFA, CLI. Console only — 45m
- [x] **2.** 🔧 VPC by hand: 2 public subnets across 2 AZs, IGW, route table, security groups — 90m
- [x] **3.** 💻 App fixes: nginx `proxy_pass` → `127.0.0.1:3000`, log colors, `trust proxy` — 30m
- [x] **4.** 🔧 Create `todo-infra` repo (with `docs/`), rewrite the VPC as Terraform — 90m
- [x] **5.** 🔧 `destroy` then `apply` — prove it's reproducible — 20m

## Block B — Images & database

- [x] **6.** 🔧 ECR console: repo, then build/tag/push both images — 45m
- [ ] **7.** 🔧 ECR in Terraform — 30m
- [ ] **8.** 🔧 RDS console: subnet group, security group, `db.t4g.micro` — 75m
- [ ] **9.** 🔧 RDS in Terraform — 60m
- [ ] **10.** 💻 Split `prisma migrate deploy` out of the entrypoint — 45m

## Block C — Identity & config

- [ ] **11.** 🔧 IAM console: task execution role vs task role, and why they differ — 60m
- [ ] **12.** 🔧 IAM in Terraform — 45m
- [ ] **13.** 🔧 SSM Parameter Store + Secrets Manager, console — 45m
- [ ] **14.** 🔧 SSM + Secrets in Terraform — 45m

## Block D — Make it run

- [ ] **15.** 🔧 ECS console: cluster, 2-container task definition, service — 2h
- [ ] **16.** 🔧 CloudWatch Logs — and how to read a task that won't start — 30m
- [ ] **17.** 🔧 ECS in Terraform — 2h
- [ ] **18.** 🔧 Run step 10's migration as a one-off ECS task — 45m
- [ ] **19.** 💻 nginx `/healthz` endpoint — 20m

## Block E — Make it reachable

- [ ] **20.** 🔧 ALB console: target group, listener, HTTP only — 90m
- [ ] **21.** 🔧 ALB in Terraform — 60m
- [ ] **22.** 🔧 Domain + ACM certificate + HTTPS listener — 90m
- [ ] **23.** 🔧 Application Auto Scaling: target + policy — 45m

## Block F — S3 attachments

- [ ] **24.** 💻 Feature: file upload on tasks, presigned URLs, upload UI — 3h
- [ ] **25.** 🔧 S3 bucket + task-role IAM scoping — 90m

## Block G — Bedrock & queues

- [ ] **26.** 💻 Feature: AI-drafted task descriptions — 2h
- [ ] **27.** 🔧 Enable model access, Bedrock inference profile + IAM — 60m
- [ ] **28.** 💻 Feature: BullMQ reminder queue — 3h
- [ ] **29.** 🔧 ElastiCache Valkey + security group — 90m

## Block H — Production practice

- [ ] **30.** 💻 Session cleanup job — 1h
- [ ] **31.** 🔧 EventBridge schedule → ECS task — 60m
- [ ] **32.** 🔧 Terraform remote state: S3 + DynamoDB, migrate off local — 75m
- [ ] **33.** 🔧 GitHub OIDC role + plan/apply workflows, mirroring `bootstrap/` — 90m

🔧 = infra · 💻 = app · Total ≈ 40 hours

---

## Open decisions

- **Step 22 needs a domain.** Not yet chosen. If there isn't one, a Route 53
  registration is ~$12/year. Decide by step 20.
- **RESOLVED — pre-existing EC2 instance.** `i-034e0057075982dbe` (`t3.small`,
  `ap-southeast-5`) is a client project, deliberately left running. It accounts
  for roughly $20-25/month of the budget alert on its own. Do not flag it again.

## Services covered

VPC · ECR · RDS · IAM · STS · SSM Parameter Store · Secrets Manager ·
ECS (Fargate) · Application Auto Scaling · CloudWatch Logs · ALB · ACM · S3 ·
DynamoDB · Bedrock · ElastiCache · EventBridge

Left out: **Client VPN** — ~$72/month, and the ToDo app has nothing private to reach.
