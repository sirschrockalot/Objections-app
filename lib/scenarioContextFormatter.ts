/**
 * Utilities for formatting scenario context for the ElevenLabs agent
 */

import { VoiceScenario } from '@/data/voiceScenarios';

/**
 * Format scenario context into a comprehensive instruction message for the agent
 */
export function formatScenarioContext(scenario: VoiceScenario): string {
  const lines: string[] = [];

  // Main agent instructions
  lines.push(scenario.agentInstructions);
  lines.push('');

  // Property context
  lines.push('PROPERTY DETAILS:');
  lines.push(`- Address: ${scenario.context.property.address}`);
  lines.push(`- Property Type: ${scenario.context.property.propertyType}`);
  lines.push(`- Purchase Price: $${scenario.context.property.purchasePrice.toLocaleString()}`);
  lines.push(`- ARV (After Repair Value): $${scenario.context.property.arv.toLocaleString()}`);
  lines.push(`- Condition: ${scenario.context.property.condition}`);
  lines.push(`- Potential Spread: $${(scenario.context.property.arv - scenario.context.property.purchasePrice).toLocaleString()}`);
  lines.push('');

  // Buyer profile
  lines.push('YOUR BUYER PROFILE:');
  lines.push(`- Type: ${scenario.context.buyer.type.replace(/-/g, ' ')}`);
  lines.push(`- Experience Level: ${scenario.context.buyer.experience}`);
  lines.push(`- Budget: $${scenario.context.buyer.budget.toLocaleString()}`);
  lines.push(`- Main Concerns: ${scenario.context.buyer.concerns.join(', ')}`);
  lines.push('');

  // Market conditions
  lines.push('MARKET CONDITIONS:');
  lines.push(`- Market Type: ${scenario.context.market.type}`);
  lines.push(`- Competition Level: ${scenario.context.market.competition}`);
  lines.push('');

  // Expected objections
  if (scenario.expectedObjections.length > 0) {
    lines.push('EXPECTED OBJECTIONS TO RAISE:');
    scenario.expectedObjections.forEach((objId, index) => {
      lines.push(`${index + 1}. Objection ID: ${objId}`);
    });
    lines.push('');
  }

  // Success criteria (for agent awareness)
  if (scenario.successCriteria.length > 0) {
    lines.push('WHAT A GOOD AGENT RESPONSE SHOULD INCLUDE:');
    scenario.successCriteria.forEach((criterion, index) => {
      lines.push(`${index + 1}. ${criterion}`);
    });
  }

  return lines.join('\n');
}

/**
 * Format scenario context as a concise system message
 */
export function formatScenarioSystemMessage(scenario: VoiceScenario): string {
  return `You are practicing a real estate objection scenario. ${scenario.name}: ${scenario.description}

${scenario.agentInstructions}

Property: ${scenario.context.property.address} - $${scenario.context.property.purchasePrice.toLocaleString()} (ARV: $${scenario.context.property.arv.toLocaleString()})
Buyer: ${scenario.context.buyer.type.replace(/-/g, ' ')} with ${scenario.context.buyer.experience} experience
Budget: $${scenario.context.buyer.budget.toLocaleString()}
Concerns: ${scenario.context.buyer.concerns.join(', ')}
Market: ${scenario.context.market.type} market with ${scenario.context.market.competition} competition

Remember to stay in character and raise objections naturally based on your buyer profile.`;
}

/**
 * Get a short context summary for logging
 */
export function getScenarioContextSummary(scenario: VoiceScenario): string {
  return `${scenario.name} - ${scenario.context.property.address} - ${scenario.context.buyer.type}`;
}

