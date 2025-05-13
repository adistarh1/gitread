# GitRead
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/adistarh1/gitread)

GitRead is an AI-powered web application that automatically generates professional README files for your GitHub repositories. Simply provide a link to your public GitHub repository, and GitRead will analyze its structure and content to create a comprehensive and well-formatted `README.md` file.

GitRead aims to simplify the documentation process, helping developers create informative and engaging project summaries with minimal effort.

## ✨ Key Features

*   **AI-Powered README Generation:** Leverages advanced AI models (Google Gemini via OpenRouter) to understand your code and generate relevant documentation.
*   **Direct GitHub Integration:** Processes public GitHub repositories via their URL.
*   **User Authentication:** Secure sign-up and sign-in using Clerk.
*   **Credit-Based System:** Manage README generations with credits. Includes Stripe integration for purchasing more credits.
*   **README History:** Access and review your previously generated READMEs, saved securely in Supabase.
*   **Interactive Editor & Preview:** View the generated README in Markdown or as rendered HTML. Edit content directly in the browser.
*   **Easy Export:** Copy the Markdown content or download the `README.md` file.
*   **Theming:** Supports both light and dark modes for a comfortable user experience.
*   **Example Repositories:** Quickly test the generator with pre-selected example GitHub repositories.
*   **Smart URL Handling:**
    *   Supports direct repository paths (e.g., `gitread.dev/username/repository`).
    *   Redirects from legacy domains like `generatemyreadme.com` and `gitread.com` to the primary `gitread.dev` domain.
*   **Generation Queue:** Efficiently handles multiple concurrent generation requests with a server-side queue.
*   **Automatic DeepWiki Badge:** Generated READMEs include a DeepWiki badge, linking to a collaborative documentation space for the analyzed repository.

## 🚀 How It Works

1.  **Input Repository URL:** Users paste the URL of a public GitHub repository into the GitRead interface on the main page.
2.  **Repository Analysis (Python Microservice):**
    *   GitRead's Next.js backend calls a dedicated Python microservice hosted on Render (`https://gitread-api.onrender.com/ingest`).
    *   This service, utilizing the `gitingest` library, clones the target repository, analyzes its file structure, extracts code snippets, and generates a concise summary and file tree.
    *   It enforces limits (file size, total size, number of files, directory depth) for efficient and safe processing.
3.  **AI Content Generation:**
    *   The structured repository data (summary, tree, content snippets) is sent to the Google Gemini Pro model via the OpenRouter API.
    *   A carefully crafted prompt instructs the AI to act as an expert technical writer and generate a README, ensuring inclusion of a DeepWiki badge for the target repository.
4.  **Display & User Interaction:**
    *   The generated README content is streamed or sent back to the user's browser.
    *   Users can preview the README, switch between Markdown source and HTML view, and make real-time edits.
    *   The finalized README can be copied to the clipboard or downloaded as an `.md` file.
5.  **Credit Deduction & History Logging:**
    *   Upon successful generation for non-example repositories, one credit is deducted from the user's account (managed in Supabase).
    *   A copy of the generated README is saved to the user's personal history, accessible within their account.

## 🛠️ Tech Stack

*   **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, `react-markdown`, `canvas-confetti`.
*   **Backend:** Next.js API Routes (TypeScript).
*   **Python Microservice:** Python 3.10. The core logic is in `scripts/git_ingest.py` utilizing the `gitingest` library, exposed as a web service on Render.
*   **AI Model:** Google Gemini Pro (via OpenRouter API, using the OpenAI SDK for interfacing).
*   **Authentication:** Clerk.
*   **Database:** Supabase (PostgreSQL) for user data, credits, README history, and Stripe event tracking.
*   **Payment Processing:** Stripe.
*   **Deployment:**
    *   Next.js Application: Likely Vercel (common for Next.js projects).
    *   Python Microservice: Render (confirmed by endpoint URL).

## 📁 Repository Structure

The repository is organized as a monorepo containing the Next.js application and related scripts:

*   `adistarh1-gitread/`
    *   `app/`: Main application directory for Next.js App Router.
        *   `api/`: Backend API route handlers (e.g., `/generate`, `/credits`, `/readme-history`, Stripe checkout/verification).
        *   `components/`: Reusable React components (`AuthModal`, `LoadingIndicator`, `BlockingCreditsModal`, etc.).
        *   `layout.tsx`, `page.tsx`: Core application layout and the main interactive page.
        *   Static content pages for terms, privacy, refund, and support.
        *   `utils/`: Client-side utility functions, Supabase client instance, and example README definitions.
    *   `middleware.ts`: Handles request-level middleware, including custom domain/path redirects and Clerk authentication logic for protected routes.
    *   `scripts/`: Contains the Python script (`git_ingest.py`) forming the core of the repository ingestion microservice.
    *   `supabase/migrations/`: SQL migrations defining the Supabase database schema and RLS policies.
    *   `public/`: Static assets like images and favicons.
    *   Configuration files: `package.json`, `tailwind.config.js`, `tsconfig.json`, `.python-version`, `requirements.txt`.

## ⚖️ Policies & Support

For more information regarding the use of GitRead, please refer to our policies:

*   **Terms of Service:** Accessible via the `/terms` page on the GitRead website.
*   **Privacy Policy:** Accessible via the `/privacy` page.
*   **Refund Policy:** Accessible via the `/refund` page.
*   **Support:** For assistance, please visit the `/support` page or contact `koyalhq@gmail.com`.
