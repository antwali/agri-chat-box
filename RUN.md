# How to Run Agri-Chat

## Quick Start (Recommended - Docker)

### Step 1: Prerequisites Check
```bash
# Check if Docker is installed
docker --version
docker-compose --version

# Check if AWS CLI is configured
aws configure list
```

### Step 2: Set Up AWS Credentials
Make sure your AWS credentials are configured:
```bash
# If not configured, run:
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### Step 3: Create Environment File
Create a `.env` file in the project root:
```bash
cat > .env << EOF
AWS_REGION=us-east-1
OPENSEARCH_ENDPOINT=
EOF
```

**Note:** The `OPENSEARCH_ENDPOINT` should be left empty to use the local Docker OpenSearch. Documents are stored locally in OpenSearch - no S3 bucket needed!

### Step 4: Enable AWS Bedrock Models (First-Time Users)

**Important:** AWS Bedrock models are automatically enabled when first invoked. However, for first-time Anthropic model users, you may need to submit use case details through the AWS console.

**Option A: Enable via AWS Bedrock Playground (Recommended for first-time Anthropic users)**
1. Go to: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/playgrounds/chat
2. Select **Claude 3 Sonnet** from the model dropdown
3. Send a test message (e.g., "Hello")
4. If prompted, fill out the use case form with your application details
5. Once you can send messages successfully, the model is enabled for your account

**Option B: Let the application enable it automatically**
- Simply start the application and try using it
- If you get an `AccessDeniedException` for Claude, use Option A above
- Titan Embeddings typically work immediately without any setup

**Note:** After the first successful invocation, models remain enabled for your account and no further action is needed.

### Step 5: Start the Application
```bash
# From the project root directory
docker-compose up --build
```

This will:
- Build the backend and frontend containers
- Start OpenSearch
- Start the backend API on http://localhost:8000
- Start the frontend on http://localhost:3000

### Step 6: Access the Application
Open your browser and go to: **http://localhost:3000**

### Step 7: Test the Application
1. **Upload a document:**
   - Click the upload button (📤)
   - Select a PDF, DOCX, TXT, or MD file
   - Wait for "Document uploaded successfully!"

2. **Ask a question:**
   - Type a question in the input field
   - Press Enter or click Send
   - See the AI-generated answer with sources

## Running in Background
```bash
# Start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Manual Setup (Without Docker)

### Backend (Terminal 1)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export AWS_REGION=us-east-1

# Start backend
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### OpenSearch (Terminal 2)
```bash
docker run -d -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "DISABLE_SECURITY_PLUGIN=true" \
  --name opensearch \
  opensearchproject/opensearch:2.11.0
```

### Frontend (Terminal 3)
```bash
cd frontend
npm install
npm start
```

## Verify Everything is Working

### Check Backend
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Check OpenSearch
```bash
curl http://localhost:9200
# Should return OpenSearch cluster information
```

### Check Frontend
Open http://localhost:3000 in your browser

## Common Issues

### Port Already in Use
```bash
# Check what's using the ports
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
lsof -i :9200  # OpenSearch

# Kill the process or change ports in docker-compose.yml
```

### AWS Bedrock Access Denied
If you encounter `AccessDeniedException` when using the application:

1. **For Claude 3 Sonnet (first-time users):**
   - Go to: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/playgrounds/chat
   - Select Claude 3 Sonnet and send a test message
   - Fill out the use case form if prompted
   - Once successful, the model will be enabled for your account

2. **Verify your setup:**
   - Check AWS credentials: `aws sts get-caller-identity`
   - Verify region matches: `AWS_REGION=us-east-1`
   - Ensure your IAM user/role has permissions to invoke Bedrock models:
     ```json
     {
       "Effect": "Allow",
       "Action": [
         "bedrock:InvokeModel",
         "bedrock:InvokeModelWithResponseStream"
       ],
       "Resource": [
         "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
         "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1"
       ]
     }
     ```

3. **Test models directly:**
   ```bash
   # Run the test script
   python test_bedrock.py
   ```

### OpenSearch Connection Failed
- Wait a few seconds after starting - OpenSearch takes time to initialize
- Check logs: `docker-compose logs opensearch`
- Verify it's running: `docker ps`

### Frontend Can't Connect to Backend
- Make sure backend is running on port 8000
- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` in docker-compose.yml

## Stopping the Application
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears OpenSearch data)
docker-compose down -v
```

