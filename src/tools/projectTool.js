import { z } from 'zod';

const projects = {
  colorDetector: {
    name: 'Color Detector Using ESP32-CAM',
    category: 'Embedded Systems / Computer Vision',
    technologies: ['ESP32-CAM', 'OLED', 'RGB NeoPixel LED'],
    description:
      'A real-time color detection system that captures an image, identifies the detected color, displays the color name and RGB values on an OLED display, and reproduces the detected color using an RGB NeoPixel LED.',
    role: 'Hardware and software integration',
  },

  soldierMonitoring: {
    name: 'Wearable IoT-Based Soldier Health and Safety Monitoring System',
    category: 'IoT / Embedded Systems',
    technologies: ['ESP32', 'GPS', 'Health Sensors', 'IoT', 'Cloud'],
    description:
      'A wearable monitoring system designed to collect soldier health and environmental information and transmit it to a control system for monitoring and alerts.',
    role: 'IoT and embedded systems development',
  },

  homeAutomation: {
    name: 'Voice-Controlled Home Automation',
    category: 'Embedded Systems',
    technologies: ['Arduino', 'Bluetooth', 'Voice Control'],
    description:
      'A voice-controlled home automation project for controlling appliances using a microcontroller and wireless communication.',
    role: 'Embedded systems development',
  },
};

// Zod schema required by FE-07.
export const projectToolSchema = z.object({
  project: z
    .enum([
      'colorDetector',
      'soldierMonitoring',
      'homeAutomation',
    ])
    .describe('The portfolio project to retrieve information about.'),
});

// Actual server-side execution.
export async function executeProjectTool(input) {
  const { project } = projectToolSchema.parse(input);

  const result = projects[project];

  if (!result) {
    throw new Error(`Project "${project}" was not found.`);
  }

  return result;
}

// Gemini function declaration.
// Google GenAI uses this declaration to decide when it should call our tool.
export const projectToolDeclaration = {
  name: 'getProjectDetails',
  description:
    'Gets structured information about one of Chaya Madli’s portfolio projects. Use this when the user asks for details about a specific portfolio project.',
  parameters: {
    type: 'OBJECT',
    properties: {
      project: {
        type: 'STRING',
        enum: [
          'colorDetector',
          'soldierMonitoring',
          'homeAutomation',
        ],
        description:
          'The portfolio project to retrieve information about.',
      },
    },
    required: ['project'],
  },
};