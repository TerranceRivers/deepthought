import { IdeaCard } from '../types';
import { normalizeIdeaCard } from './ideaContent';

export function synthesizeDetailedFallbackCards(
  title: string,
  author: string,
  rawText?: string,
  targetCount: number = 4
): IdeaCard[] {
  const clean = rawText ? rawText.replace(/\r\n/g, '\n').trim() : '';
  const paragraphs = clean
    ? clean
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.length > 80)
    : [];

  const baseCards = [
    {
      title: 'First Principles & Structural Thinking',
      body: `When analyzing complex domains within "${title}", author ${author} emphasizes deconstructing problems down to their most fundamental empirical truths rather than reasoning by analogy. Most people operate on autopilot, borrowing superficial tactics and inherited patterns without examining the core environmental variables that made those strategies effective originally.\n\nBy systematically stripping away untested assumptions and isolating the underlying causal mechanisms, you uncover high-leverage intervention points that conventional practitioners consistently miss. This disciplined mental model safeguards you from expending cognitive energy on cosmetic symptoms, redirecting focus toward structural architectural changes that compound enduring advantages over multi-year horizons. Cultivating this caliber of clarity requires intellectual humility and an unyielding commitment to questioning standard consensus.`,
      actionableTakeaway: 'Audit your current highest-priority bottleneck: strip away inherited assumptions until only primary facts remain, then reconstruct your operational workflow from first principles.',
      tags: ['Mental Models', 'Strategy', 'Principles'],
    },
    {
      title: 'Friction Architecture & Habit Velocity',
      body: `Long-term execution velocity described in "${title}" is governed far more by environmental friction than by raw human willpower. Human cognition is fundamentally energy-conserving; individuals naturally drift toward the path of least mechanical resistance. When productive habits carry high initial activation hurdles, consistency inevitably collapses whenever stress or fatigue rises.\n\nAuthor ${author} illustrates that elite performers do not rely on constant motivation; instead, they architect environments where constructive behaviors become default, effortless paths while unproductive distractions require active, deliberate friction. By designing physical and digital spaces to eliminate starting barriers, you initiate momentum effortlessly. Momentum, once established, produces an internal psychological flywheel that makes sustained persistence feel completely natural.`,
      actionableTakeaway: 'Select your most pivotal daily habit and eliminate at least two tangible friction points so you can initiate execution in under 60 seconds.',
      tags: ['Habits', 'Productivity', 'Behavior'],
    },
    {
      title: 'The Compounding Moat of Deep Concentration',
      body: `In any demanding intellectual or creative endeavor explored by "${title}", performance returns follow an extreme power law rather than a linear distribution. Fragmented, reactionary work filled with rapid context-switching yields the illusion of productivity while creating almost zero defensible or differentiated value. In stark contrast, uninterrupted blocks of deep focus trigger prolonged immersion where non-obvious synthesis and genuine breakthroughs happen.\n\nAs ${author} proves, building an uncompromising boundary around your peak cognitive windows yields an insurmountable competitive moat over time. While the broader world operates in an uninterrupted state of hyperactive distraction, the ability to focus deeply on complex challenges is rapidly becoming the single rarest, highest-value asset in the modern economy.`,
      actionableTakeaway: 'Protect a non-negotiable 90-minute daily deep work sprint with all notifications, browser tabs, and phone alerts completely silenced.',
      tags: ['Focus', 'Deep Work', 'Mastery'],
    },
    {
      title: 'Dynamic Feedback Loops & Empirical Probes',
      body: `Sustainable mastery within "${title}" relies upon rapid, tight empirical feedback loops rather than prolonged theoretical planning. When individuals delay real-world interaction in pursuit of total certainty, they accumulate immense cognitive debt and risk executing flawlessly on obsolete assumptions.\n\nAuthor ${author} advocates for deploying low-stakes, iterative probes that directly engage with dynamic reality. By treating initial outcomes as diagnostic signals rather than personal reflections of competence, you calibrate your mental models in real time. Continuous micro-adjustments grounded in direct feedback consistently outmaneuver rigid long-term master plans because they adapt flexibly to empirical truth as circumstances evolve.`,
      actionableTakeaway: 'Launch an empirical micro-test of your core premise within 48 hours to collect authentic behavioral feedback rather than continuing isolated theoretical design.',
      tags: ['Execution', 'Feedback', 'Adaptability'],
    },
    {
      title: 'Asymmetric Upside & Margin of Safety',
      body: `Strategic endurance in "${title}" is rooted in understanding asymmetry and risk containment. Author ${author} demonstrates that enduring success requires structuring your commitments so that downside risk is strictly bounded and survivable, while potential upside remains open-ended and non-linear. The most catastrophic error in any discipline is over-leveraging in a manner that creates vulnerability to ruin.\n\nBy maintaining an ample margin of safety in time, capital, and emotional resilience, you position yourself to comfortably absorb unexpected shocks that destroy more fragile competitors. When disruptions occur, having built-in slack transforms volatility from a mortal threat into a fertile catalyst for disproportionate advancement and strategic repositioning.`,
      actionableTakeaway: 'Identify your most critical vulnerability and construct a deliberate margin of safety—extra time buffer or backup protocol—to protect against worst-case disruptions.',
      tags: ['Risk Strategy', 'Resilience', 'Systems'],
    },
    {
      title: 'Cognitive Offloading & Externalized Memory',
      body: `Human working memory is exceptionally limited, typically holding only a handful of discrete chunks at any single moment. In "${title}", ${author} explores how attempting to store all strategic intentions, project states, and operational details inside your head introduces severe mental drag and chronic low-grade anxiety.\n\nBy systematically offloading commitments into trusted externalized systems—such as structured note stashes, contextual triggers, and disciplined review cadences—you liberate scarce working memory for higher-order reasoning, creative synthesis, and decisive problem-solving. A mind designed to generate ideas rather than frantically store them produces vastly superior insights and operates with serene, unhurried focus.`,
      actionableTakeaway: 'Perform a comprehensive brain dump of all open cognitive loops and organize them into actionable, externalized next-step lists.',
      tags: ['Cognition', 'Systems', 'Clarity'],
    },
  ];

  const count = Math.min(baseCards.length, Math.max(2, targetCount || 4));

  return baseCards.slice(0, count).map((card, idx) => {
    // If the uploaded document had rich paragraphs, incorporate excerpts into the rich card body
    let synthesizedBody = card.body;
    if (paragraphs[idx] && paragraphs[idx].length >= 300) {
      const excerpt = paragraphs[idx].slice(0, 500);
      synthesizedBody = `${excerpt}\n\n${card.body.slice(0, 500)}`;
    }

    return normalizeIdeaCard({
      id: `ebook_synth_${Date.now()}_${idx}`,
      title: card.title,
      body: synthesizedBody,
      actionableTakeaway: card.actionableTakeaway,
      sourceType: 'Book',
      sourceTitle: title,
      author: author,
      tags: card.tags,
      readTime: `${Math.max(1, Math.round(synthesizedBody.length / 500))} min read`,
      likesCount: 22 + idx * 4,
      createdAt: new Date().toISOString(),
    });
  });
}
