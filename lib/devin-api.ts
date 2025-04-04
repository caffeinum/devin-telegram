// Devin API client for interacting with the Devin API
const DEVIN_API_BASE_URL = "https://api.devin.ai/v1"

// Interface for session creation response
interface CreateSessionResponse {
  session_id: string
  url: string
  is_new_session?: boolean
}

// Interface for session details
interface SessionDetails {
  session_id: string
  status: string
  title: string | null
  created_at: string
  updated_at: string
  snapshot_id: string | null
  playbook_id: string | null
  pull_request: { url: string } | null
  structured_output: Record<string, unknown> | null
  status_enum: "RUNNING" | "blocked" | "stopped" | null
}

// Create a new Devin session
export async function createDevinSession(prompt: string): Promise<CreateSessionResponse> {
  const response = await fetch(`${DEVIN_API_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEVIN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      idempotent: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create Devin session: ${response.status} ${errorText}`)
  }

  return await response.json()
}

// Send a message to an existing Devin session
export async function sendMessageToDevinSession(sessionId: string, message: string): Promise<void> {
  const response = await fetch(`${DEVIN_API_BASE_URL}/session/${sessionId}/message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEVIN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to send message to Devin session: ${response.status} ${errorText}`)
  }
}

// Get details about an existing Devin session
export async function getDevinSessionDetails(sessionId: string): Promise<SessionDetails> {
  const response = await fetch(`${DEVIN_API_BASE_URL}/session/${sessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.DEVIN_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get Devin session details: ${response.status} ${errorText}`)
  }

  return await response.json()
}

// Upload a file to Devin
export async function uploadFileToDevin(file: File | Blob): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${DEVIN_API_BASE_URL}/attachments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEVIN_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to upload file to Devin: ${response.status} ${errorText}`)
  }

  return await response.text()
}

