# 01 — Account setup

## AWS account

- Account ID: 221082178177
- Console sign-in URL: https://221082178177.signin.aws.amazon.com/console

## IAM user

- User name: hakim-admin
- Access type: console + CLI access keys

## Where the secrets live

Password and access keys are in `docs/credentials.local.md`, which is gitignored
and never committed. CLI keys are also stored in `~/.aws/credentials` via
`aws configure`.

## General steps
Upon creating root email account, make sure to create a separate IAM admin user. It can be created in the IAM under User section    

Create a user with AdministratorAccess privilege. Upon creation, log out from the root email account, login using the new IAM user, and then make sure to configure multi-factor authentication for the new IAM user    
