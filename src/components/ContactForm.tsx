"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

interface ContactFormProps {
  email?: string;
  formspreeEndpoint?: string;
}

export default function ContactForm({
  email = "hello@example.com",
  formspreeEndpoint,
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (formspreeEndpoint) {
      try {
        const response = await fetch(formspreeEndpoint, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          setSubmitStatus("success");
          form.reset();
        } else {
          setSubmitStatus("error");
        }
      } catch {
        setSubmitStatus("error");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const name = formData.get("name") as string;
      const from = formData.get("email") as string;
      const subject = formData.get("subject") as string;
      const message = formData.get("message") as string;
      const mailtoSubject = encodeURIComponent(subject || `Contact from ${name}`);
      const mailtoBody = encodeURIComponent(
        `Name: ${name}\nEmail: ${from}\n\nMessage:\n${message}`
      );
      window.location.href = `mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`;
      setSubmitStatus("success");
      form.reset();
      setIsSubmitting(false);
    }
  }

  if (submitStatus === "success") {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 shrink-0 text-amber-500" />
          <div>
            <h3 className="font-semibold text-white">Message sent successfully!</h3>
            <p className="text-sm text-zinc-400">
              Thank you for your message. I&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSubmitStatus("idle")}
          className="mt-4 text-sm font-medium text-amber-500 hover:text-amber-400"
        >
          Send new message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="contact-name"
          className="mb-2 block text-sm font-medium text-zinc-400"
        >
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Your name"
        />
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className="mb-2 block text-sm font-medium text-zinc-400"
        >
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label
          htmlFor="contact-subject"
          className="mb-2 block text-sm font-medium text-zinc-400"
        >
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="What is this about?"
        />
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="mb-2 block text-sm font-medium text-zinc-400"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          className="w-full resize-none rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Message..."
        />
      </div>

      {submitStatus === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-900/20 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">
            Something went wrong. Please try again.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Send message
          </>
        )}
      </button>
    </form>
  );
}
