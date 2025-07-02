const { z } = require("zod");
const fs = require("fs").promises;
const path = require("path");

function createTools() {
  return {
    list_directory: {
      description: "Lists the names of files and subdirectories directly within a specified directory path.",
      inputSchema: {
        path: z.string().describe("The absolute path to the directory to list."),
      },
      async execute({ path: dirPath }) {
        try {
          const files = await fs.readdir(dirPath);
          return { files };
        } catch (error) {
          return { error: error.message };
        }
      },
    },
    read_file: {
      description: "Reads and returns the content of a specified file.",
      inputSchema: {
        absolute_path: z.string().describe("The absolute path to the file to read."),
      },
      async execute({ absolute_path }) {
        try {
          const content = await fs.readFile(absolute_path, "utf-8");
          return { content };
        } catch (error) {
          return { error: error.message };
        }
      },
    },
  };
}

module.exports = { createTools };
