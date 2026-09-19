### Difference between VPC and EC2
EC2 -> compute layer
VPC -> networking layer

Every EC2 needs to run on within VPC
You basically can define the network layer of your own compute by specifying IP address ranges, subnets, route, tables, and network gateways to securely host and connect AWS resources

### What is availability zone?
Isolated data centers within same AWS region. Separate generators, separate cooling, separate infrastructures. All availability zones within same regions are interconnected.


## Questions
1. Destination 0.0.0.0/0? What is it for?
2. Fargate task must reach ECR to pull its images?
3. Normal path: private subnet plus a NAT gateway?
4. Each task getting its own public IP?