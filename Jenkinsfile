pipeline {
    agent any

    // ================================
    // ENVIRONMENT VARIABLES
    // ================================
    environment {
        APP_NAME        = 'taskflow'
        DOCKER_IMAGE    = "vishalgangwal/${APP_NAME}"
        DOCKER_TAG      = "${BUILD_NUMBER}"
        DOCKER_LATEST   = "${DOCKER_IMAGE}:latest"
        DOCKER_VERSIONED = "${DOCKER_IMAGE}:${DOCKER_TAG}"
        CONTAINER_PORT  = '3000'
        HOST_PORT       = '3000'
        NODE_VERSION    = '18'
    }

    // ================================
    // PIPELINE OPTIONS
    // ================================
    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    // ================================
    // TRIGGERS
    // ================================
    triggers {
        pollSCM('H/5 * * * *')   // Poll every 5 minutes
        // githubPush()            // Uncomment for GitHub webhook
    }

    // ================================
    // STAGES
    // ================================
    stages {

        // --- STAGE 1: Checkout ---
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
                script {
                    env.GIT_COMMIT_MSG  = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    env.GIT_AUTHOR      = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
                    env.GIT_SHORT_SHA   = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
                echo "📌 Commit: ${env.GIT_SHORT_SHA} by ${env.GIT_AUTHOR}"
                echo "💬 Message: ${env.GIT_COMMIT_MSG}"
            }
        }

        // --- STAGE 2: Install Dependencies ---
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
                echo '✅ Dependencies installed'
            }
        }

        // --- STAGE 3: Lint ---
        stage('Lint') {
            steps {
                echo '🔍 Running ESLint...'
                sh 'npm run lint || echo "Lint warnings (non-blocking)"'
            }
        }

        // --- STAGE 4: Unit Tests ---
        stage('Unit Tests') {
            steps {
                echo '🧪 Running unit tests...'
                sh 'npm test -- --coverage --forceExit'
            }
            post {
                always {
                    // Publish test results if JUnit plugin installed
                    // junit 'coverage/junit.xml'
                    echo '📊 Test stage complete'
                }
            }
        }

        // --- STAGE 5: Security Audit ---
        stage('Security Audit') {
            steps {
                echo '🔒 Running npm security audit...'
                sh 'npm audit --audit-level=high || echo "Audit warnings found"'
            }
        }

        // --- STAGE 6: Build Docker Image ---
        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image: ${DOCKER_VERSIONED}"
                sh """
                    docker build \
                        --build-arg APP_VERSION=${BUILD_NUMBER} \
                        --build-arg BUILD_DATE=\$(date -u +%Y-%m-%dT%H:%M:%SZ) \
                        --build-arg GIT_SHA=${env.GIT_SHORT_SHA} \
                        -t ${DOCKER_VERSIONED} \
                        -t ${DOCKER_LATEST} \
                        .
                """
                echo "✅ Docker image built: ${DOCKER_VERSIONED}"
            }
        }

        // --- STAGE 7: Test Docker Image ---
        stage('Test Docker Image') {
            steps {
                echo '🔬 Testing Docker image health...'
                sh """
                    docker run -d \
                        --name ${APP_NAME}-test-${BUILD_NUMBER} \
                        -p 3999:3000 \
                        -e NODE_ENV=test \
                        -e MONGO_URI=mongodb://host.docker.internal:27017/tododb_test \
                        ${DOCKER_LATEST}

                    sleep 10

                    curl -f http://localhost:3999/health || (docker logs ${APP_NAME}-test-${BUILD_NUMBER} && exit 1)
                    echo "✅ Health check passed"
                """
            }
            post {
                always {
                    sh """
                        docker stop ${APP_NAME}-test-${BUILD_NUMBER} || true
                        docker rm ${APP_NAME}-test-${BUILD_NUMBER} || true
                    """
                }
            }
        }

        // --- STAGE 8: Push to Docker Hub ---
        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                echo '📤 Pushing image to Docker Hub...'
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                        docker push ${DOCKER_VERSIONED}
                        docker push ${DOCKER_LATEST}
                        docker logout
                    """
                }
                echo "✅ Pushed: ${DOCKER_VERSIONED}"
            }
        }

        // --- STAGE 9: Deploy ---
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo '🚀 Deploying with Docker Compose...'
                sh """
                    export APP_VERSION=${BUILD_NUMBER}
                    docker compose down --remove-orphans || true
                    docker compose up -d --build
                    docker compose ps
                """
                echo '✅ Deployment complete!'

                // Wait and verify
                sh 'sleep 15'
                sh "curl -f http://localhost:${HOST_PORT}/health || exit 1"
                echo '✅ Production health check passed!'
            }
        }

        // --- STAGE 10: Smoke Test ---
        stage('Smoke Test') {
            when {
                branch 'main'
            }
            steps {
                echo '💨 Running smoke tests...'
                sh """
                    # Check app is responding
                    curl -sf http://localhost:${HOST_PORT}/health | grep -q '"status":"healthy"'
                    echo "✅ /health — OK"

                    # Check API endpoint
                    curl -sf http://localhost:${HOST_PORT}/api/todos | grep -q 'todos'
                    echo "✅ /api/todos — OK"
                """
                echo '✅ All smoke tests passed!'
            }
        }
    }

    // ================================
    // POST ACTIONS
    // ================================
    post {
        always {
            echo '🧹 Cleaning up...'
            sh 'docker image prune -f || true'
        }
        success {
            echo """
            ✅ ================================
            ✅  BUILD #${BUILD_NUMBER} SUCCEEDED
            ✅  ${APP_NAME}:${BUILD_NUMBER}
            ✅  Branch: ${GIT_BRANCH}
            ✅  Author: ${env.GIT_AUTHOR}
            ✅ ================================
            """
        }
        failure {
            echo """
            ❌ ================================
            ❌  BUILD #${BUILD_NUMBER} FAILED
            ❌  Check logs above for details
            ❌ ================================
            """
        }
        unstable {
            echo '⚠️ Build is unstable — tests may have failed'
        }
    }
}
