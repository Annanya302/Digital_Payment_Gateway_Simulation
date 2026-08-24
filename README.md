# Digital Payment Gateway Simulation

## Project Description

The Digital Payment Gateway Simulation is a web-based application that simulates the workflow of a secure digital payment gateway. The system allows users to register, log in, initiate simulated payments, verify transactions, view transaction status, and access transaction history.

The project focuses on understanding digital payment workflows, user authentication, transaction management, security, testing, version control, and collaborative software development.

> **Note:** This is an academic simulation project. No real money is processed.

## Team Members

1. **Ankur** – Coding and Testing
2. **Atul** – Coding and Testing
3. **Anamay** – Documentation
4. **Annanya** – Design

## Technologies

* Next.js
* Tailwind CSS
* Node.js
* Express.js
* Supabase

## Project Structure

```text
digital-payment-gateway-simulation/
│
├── README.md
│
├── docs/
│   ├── SRS/
│   └── UML/
│
├── src/
│   ├── frontend/
│   └── backend/
│
├── test/
│
└── .gitignore
```

Software Engineering involves several activities such as requirements analysis, design, coding, testing, version control, documentation, and project management.

Different tools and technologies are used for different activities.

| Activity                   | Tools / Technologies    |
| -------------------------- | ----------------------- |
| Requirements Documentation | MS Word, Google Docs    |
| UML Design                 | Draw.io, StarUML        |
| UI/UX Design               | Figma                   |
| Frontend Development       | Next.js, Tailwind CSS   |
| Backend Development        | Node.js, Express.js     |
| Database                   | Supabase                |
| Version Control            | Git                     |
| Code Repository            | GitHub                  |
| Project Management         | GitHub Projects, Trello |
| API Testing                | Postman                 |
| Testing                    | Manual Testing, Jest    |
| Documentation              | Markdown, MS Word       |

---

# Experiment 1: Introduction to Software Engineering Tools and Project Setup

Select a real-world software project, form the project team, create its GitHub repository, and demonstrate basic version control operations.

## Aim

To select a real-world software project, form a project team, create a GitHub repository, and demonstrate basic Git and GitHub version control operations.

## Objectives

* Select an appropriate real-world software project.
* Define project team roles and responsibilities.
* Create a GitHub repository.
* Create the initial project structure.
* Perform basic Git operations such as add, commit, push, pull, and status.
* Understand collaborative software development using GitHub.

## Tools Required

| Tool                        | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| Visual Studio Code          | Creating and managing project files          |
| Git                         | Version control and tracking project changes |
| GitHub                      | Remote repository and team collaboration     |
| Web Browser                 | Accessing GitHub and managing the repository |
| Git Bash / VS Code Terminal | Executing Git commands                       |
| Next.js                     | Frontend application development             |
| Tailwind CSS                | User interface styling                       |
| Node.js and Express.js      | Backend API development                      |
| Supabase                    | Database and backend services                |
| Figma                       | User interface and experience design         |
| Postman                     | API testing                                  |

## Introduction

**Git** is a distributed version control system used to track changes in source code. **GitHub** is a cloud-based platform used to host Git repositories and support collaborative software development.

Version control helps developers maintain project history, collaborate with team members, manage different versions of software, and recover previous versions when required.

The basic Git workflow is:

```text
Working Directory
       ↓
   git add
       ↓
Staging Area
       ↓
 git commit
       ↓
Local Repository
       ↓
  git push
       ↓
Remote Repository (GitHub)
```

## Problem Statement

Develop a **Digital Payment Gateway Simulation** using Software Engineering principles. Create a GitHub repository for the project, organise the project team, create the initial project structure, and demonstrate essential Git operations.

## Selected Project

**Project Title:** Digital Payment Gateway Simulation

**Domain:** FinTech / Digital Payments

**Objective:** Develop a web-based digital payment gateway simulation that allows users to register, log in, initiate simulated payment transactions, verify payments, and view transaction status and history.

The system will simulate different transaction states such as:

* Successful transactions
* Failed transactions
* Pending transactions

The project will focus on creating a secure and user-friendly payment workflow using modern web technologies.

## Project Team

| Role               | Responsibility                                          | Member  |
| ------------------ | ------------------------------------------------------- | ------- |
| Developer & Tester | Coding, testing, integration, and bug fixing            | Ankur   |
| Developer & Tester | Coding, testing, integration, and bug fixing            | Atul    |
| Documentation Lead | Project documentation, README, SRS, and project records | Anamay  |
| UI/UX Designer     | User interface design, layouts, and user experience     | Annanya |

## Project Setup

Create the following project structure in Visual Studio Code:

```text
digital-payment-gateway-simulation/
│
├── README.md
│
├── docs/
│   ├── SRS/
│   └── UML/
│
├── src/
│   ├── frontend/
│   └── backend/
│
├── test/
│
└── .gitignore
```

## Repository Creation Steps

1. Create a GitHub account and sign in.
2. Click **New Repository**.
3. Repository Name: `digital-payment-gateway-simulation`
4. Add a `README.md` file.
5. Choose **Public** or **Private** visibility.
6. Click **Create Repository**.
7. Add the team members as collaborators.

## Basic Git Commands

| Operation                 | Command                                  |
| ------------------------- | ---------------------------------------- |
| Check Git version         | `git --version`                          |
| Initialize repository     | `git init`                               |
| Check status              | `git status`                             |
| Add files                 | `git add .`                              |
| Commit changes            | `git commit -m "Initial project setup"`  |
| Connect remote repository | `git remote add origin <repository-url>` |
| Rename branch             | `git branch -M main`                     |
| Push changes              | `git push -u origin main`                |
| Pull latest changes       | `git pull origin main`                   |
| View history              | `git log --oneline`                      |

## Version Control Demonstration

### Step 1: Initialize the local repository

```bash
git init
```

### Step 2: Check the repository status

```bash
git status
```

### Step 3: Add project files to the staging area

```bash
git add .
```

### Step 4: Create the first commit

```bash
git commit -m "Initial project setup"
```

### Step 5: Connect the local repository to GitHub

```bash
git remote add origin <repository-url>
```

### Step 6: Push the project to GitHub

```bash
git branch -M main
git push -u origin main
```

### Step 7: Make a change in README.md, then stage and commit it

```bash
git add .
git commit -m "Update project documentation"
```

### Step 8: Push the latest changes

```bash
git push
```

### Step 9: View the commit history

```bash
git log --oneline
```

### Step 10: Obtain changes made by other team members

```bash
git pull origin main
```

## Repository Structure

```text
digital-payment-gateway-simulation/
│
├── README.md
├── docs/
│   ├── SRS/
│   └── UML/
├── src/
│   ├── frontend/
│   └── backend/
├── test/
└── .gitignore
```

**README.md** – Contains the project description and basic information.

**docs/** – Contains project documentation, SRS, and UML diagrams.

**src/** – Contains frontend and backend source code.

**test/** – Contains testing files and test-related documentation.

**.gitignore** – Contains files and folders that should not be tracked by Git.

## Expected Outcome

The GitHub repository should contain the initial **Digital Payment Gateway Simulation** project structure, README file, documentation folders, source-code folder, testing folder, and Git version history. All team members should be able to access the repository and collaborate using GitHub.

## Observation

Git and GitHub provide an effective mechanism for maintaining software versions and collaborating among team members. The Working Directory, Staging Area, Local Repository, and Remote Repository form the basic Git workflow.

Different team members can work on coding, testing, documentation, and design while using GitHub to manage changes and collaborate on the project.

## Result

A **Digital Payment Gateway Simulation** project was successfully selected and the project team was formed. A GitHub repository was created, the initial project structure was established, and basic Git version-control operations including **add, commit, push, pull, status, and log** were successfully demonstrated.
