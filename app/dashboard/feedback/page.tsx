"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.role === "Super Admin") {
      fetch("/api/feedback")
        .then(res => res.json())
        .then(data => setFeedbacks(data));
    }
  }, [session?.user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, rating }),
      });

      if (res.ok) {
        toast.success("Feedback submitted successfully!");
        setMessage("");
        setRating(5);
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">Send your thoughts to the admin.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
            <CardDescription>We'd love to hear your thoughts and suggestions.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted border-muted"
                      }`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Tell us what you think..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting && <Spinner className="mr-2 h-3.5 w-3.5" />}
                {submitting ? "Submitting…" : "Send Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {session?.user?.role === "Super Admin" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">User Feedback</h2>
            {feedbacks.length === 0 ? (
              <p className="text-muted-foreground">No feedback received yet.</p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb) => (
                  <Card key={fb._id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-sm font-medium">{fb.userId?.name || 'Unknown'}</CardTitle>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <CardDescription className="text-xs">{new Date(fb.createdAt).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{fb.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
