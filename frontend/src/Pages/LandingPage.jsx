
import React from 'react';
import {
  ArrowRight,
  MapPin,
  ScanLine,
  ClipboardCheck,
  Activity,
  ChevronRight
} from 'lucide-react';

export default function LandingPage({ onStartInspection, onTrackComplaint }) {
  return (
    <div className="min-h-screen bg-[#f5f4ef] text-[#17252d]">
      <header className="border-b border-[#d9dedb] bg-[#f5f4ef]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={onStartInspection}
            className="flex items-center gap-3 text-left"
            aria-label="RoadWise home"
          >
            <span className="flex h-10 w-10 items-center justify-center bg-[#173b43] text-sm font-bold tracking-tight text-white">
              RW
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">RoadWise</span>
              <span className="block text-xs text-[#65747a]">Road inspection & maintenance</span>
            </span>
          </button>

          <nav className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={onTrackComplaint}
              className="hidden text-sm font-medium text-[#40545b] transition-colors hover:text-[#137c73] sm:inline-flex"
            >
              Track a report
            </button>
            <button
              onClick={onStartInspection}
              className="inline-flex items-center gap-2 bg-[#173b43] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#24545c]"
            >
              Report road damage <ArrowRight size={16} />
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="animate-[fadeIn_500ms_ease-out_both]">
            <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#137c73]">
              <span className="h-2 w-2 bg-[#137c73]" />
              Evidence-led road maintenance
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Better road inspections.
              <span className="block text-[#137c73]">Clearer priorities.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#52646a] sm:text-lg sm:leading-8">
              Turn road damage photos into structured inspection reports.
              RoadWise helps organize damage evidence, assess maintenance risk,
              and identify which inspected roads may need attention first.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onStartInspection}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#173b43] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#24545c] hover:shadow-lg hover:shadow-[#173b43]/10"
              >
                Start an inspection <ArrowRight size={17} />
              </button>
              <button
                onClick={onTrackComplaint}
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#cbd4d0] px-5 py-3 text-sm font-semibold text-[#173b43] transition-colors hover:border-[#137c73] hover:bg-white"
              >
                Track an existing report <ChevronRight size={17} />
              </button>
            </div>

            <p className="mt-5 text-xs leading-5 text-[#718087]">
              A decision-support prototype. Inspection results may require human verification.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 border border-[#d7dfda]" />
            <div className="relative overflow-hidden bg-[#dce3df]">
              <img
                src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=85"
                alt="Road extending through a landscape"
                className="h-[300px] w-full object-cover sm:h-[400px] lg:h-[470px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102e34]/75 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                <div className="max-w-sm border border-white/20 bg-[#102e34]/90 p-4 text-white backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                      Inspection workflow
                    </span>
                    <Activity size={17} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <ScanLine size={18} className="mb-2 text-[#81d4c7]" />
                      <span className="text-xs text-white/80">Detect</span>
                    </div>
                    <div>
                      <ClipboardCheck size={18} className="mb-2 text-[#81d4c7]" />
                      <span className="text-xs text-white/80">Assess</span>
                    </div>
                    <div>
                      <MapPin size={18} className="mb-2 text-[#81d4c7]" />
                      <span className="text-xs text-white/80">Prioritize</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#d9dedb] bg-[#ebece6]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold">01 / Inspect</p>
              <p className="mt-2 text-sm leading-6 text-[#5d6c71]">
                Submit a road image with location and road context.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">02 / Assess</p>
              <p className="mt-2 text-sm leading-6 text-[#5d6c71]">
                Review detected damage, condition, and contextual risk.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">03 / Prioritize</p>
              <p className="mt-2 text-sm leading-6 text-[#5d6c71]">
                Compare saved inspections to guide maintenance review.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-[#718087] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>RoadWise · Road inspection and maintenance prioritization</span>
        <span>Prototype · Results require appropriate human review</span>
      </footer>
    </div>
  );
}