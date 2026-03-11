"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

interface CandidatePost {
  id: number
  name: string
  office: string
  state: string
  party: string
  date: string
  content: string
}

export default function CandidatesPage() {
  const [posts, setPosts] = useState<CandidatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    office: "",
    state: "",
    party: "",
    content: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/candidates/posts")
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/candidates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newPost = await response.json()
        setPosts([newPost, ...posts])
        setFormData({
          name: "",
          office: "",
          state: "",
          party: "",
          content: "",
        })
        setShowForm(false)
      } else {
        alert("Failed to create post. Please try again.")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getPartyVariant = (party: string) => {
    const lowerParty = party.toLowerCase()
    if (lowerParty.includes("democrat")) return "default"
    if (lowerParty.includes("republican")) return "danger"
    return "neutral"
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-[40px] font-bold text-[#1E3A5F] mb-4">
          Candidate Posts
        </h1>
        <p className="text-[16px] text-[#64748B] mb-6">
          A platform for candidates running for office to share updates and connect with voters.
        </p>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "primary"}
        >
          {showForm ? "Cancel" : "Create Post"}
        </Button>
      </div>

      {/* Submission Form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="text-[24px] font-semibold text-[#1E3A5F] mb-6">
            Create New Post
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-semibold text-[#334155] mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="Candidate Name"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#334155] mb-2">
                  Office *
                </label>
                <input
                  type="text"
                  required
                  value={formData.office}
                  onChange={(e) =>
                    setFormData({ ...formData, office: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g., U.S. Senate, U.S. House"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-semibold text-[#334155] mb-2">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g., TX, CA, NY"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#334155] mb-2">
                  Party *
                </label>
                <input
                  type="text"
                  required
                  value={formData.party}
                  onChange={(e) =>
                    setFormData({ ...formData, party: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g., Democrat, Republican, Independent"
                />
              </div>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#334155] mb-2">
                Post Content *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                placeholder="Share your campaign update..."
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Post"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center py-12 text-[#64748B]">Loading posts...</div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#64748B]">No posts yet. Be the first to share!</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="flex items-start gap-4">
                {/* Avatar Placeholder */}
                <div className="flex-shrink-0 w-12 h-12 bg-[#E2E8F0] rounded-full flex items-center justify-center text-[#64748B] font-semibold text-lg">
                  {post.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-grow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[18px] font-bold text-[#1E3A5F] mb-1">
                        {post.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] text-[#64748B]">
                          Running for: {post.office} — {post.state}
                        </span>
                        <span className="text-[#E2E8F0]">•</span>
                        <Badge
                          variant={getPartyVariant(post.party)}
                          className="text-[12px] px-2 py-0.5"
                        >
                          {post.party}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-[12px] text-[#94A3B8] whitespace-nowrap">
                      {formatDate(post.date)}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-[15px] text-[#334155] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
