# Flex Budget

A personal finance web app built for people whose income changes every month.

## Why I built this

I'm a college student. My income isn't consistent — some months I pick up freelance work, other months it's slower. Every budgeting app I tried assumed I made the same amount each month, which made them pretty useless for my situation. I wanted something that could adapt based on what I actually earned, not what I was supposed to earn.

So I built Flex Budget. You enter what you made this month across however many income sources you have, and the app figures out a realistic budget based on how stable or unstable your income has been recently. The less consistent your income, the more conservative the budget it suggests.

## What it does

You start by logging your income for the month — freelance work, part-time job, whatever it is. If you add your earnings from the past two months, the app calculates a confidence score that reflects how predictable your income is. Based on that score, it splits your money into three buckets: what's safe to spend, what you should save, and what you should keep as an emergency buffer.

From there you can log expenses by category and watch how your spending tracks against your budget in real time. There's a chart that breaks down where your money is going and a warning system that flags you when your income spikes unusually high — because a good month can trick you into spending more than you should.

## Confidence score breakdown

The score compares your current month to the previous two. The more your income swings around, the lower the score, and the more conservative the spending recommendation.

- Stable (75-100): 70% spend, 20% save, 10% buffer
- Variable (45-74): 60% spend, 25% save, 15% buffer  
- Irregular (0-44): 50% spend, 30% save, 20% buffer

## Tech stack

Built with HTML, CSS, and vanilla JavaScript. No frameworks, no backend. Chart.js handles the spending breakdown visualization. Data persists in localStorage so nothing gets lost on refresh.

## Running it locally

```bash
git clone https://github.com/KwadwoCod/Flex-budget.git
cd Flex-budget
open index.html
```

No installs, no setup. Just open the file in a browser.

## What I'd add next

- Month-by-month history so you can see patterns over time
- Ability to set spending limits per category
- Export to CSV for people who also track things in a spreadsheet
- Mobile app version

## Background

This started as a personal problem. I did user research and competitive analysis to confirm other irregular earners felt the same gap, then scoped the MVP around the features that would actually change spending behavior — confidence scoring, surge warnings, and real-time tracking. The goal was never to build another budgeting app. It was to build one that works for people like me.
