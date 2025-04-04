"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function Home() {
  const [vercelUrl, setVercelUrl] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!vercelUrl) {
      setVercelUrl(window.location.origin)
    }
  }, [vercelUrl])

  const setupWebhook = async () => {
    if (!vercelUrl) {
      setStatus("error")
      setMessage("Please enter your Vercel deployment URL")
      return
    }

    setStatus("loading")
    try {
      // Format the URL correctly
      const baseUrl = vercelUrl.trim().replace(/\/$/, "")
      const webhookUrl = `${baseUrl}/api/telegram`

      // Make a request to the Telegram API to set up the webhook
      const response = await fetch(`/api/setup-webhook?url=${encodeURIComponent(webhookUrl)}`)
      const data = await response.json()

      if (data.ok) {
        setStatus("success")
        setMessage(`Webhook set up successfully at ${webhookUrl}`)
      } else {
        setStatus("error")
        setMessage(`Error: ${data.description || "Unknown error"}`)
      }
    } catch (error) {
      setStatus("error")
      setMessage(`Error setting up webhook: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Telegram Echo Bot Setup</CardTitle>
          <CardDescription>Set up your Telegram bot webhook to start receiving messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="vercel-url" className="text-sm font-medium">
              Your Vercel Deployment URL
            </label>
            <Input
              id="vercel-url"
              placeholder="https://your-project.vercel.app"
              value={vercelUrl}
              onChange={(e) => setVercelUrl(e.target.value)}
            />
          </div>

          {status === "success" && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={setupWebhook} disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Setting up..." : "Set Up Webhook"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

