const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const BaseTool = require('./BaseTool');

class FileSystemTool extends BaseTool {
  constructor() {
    super(
      'file_system',
      'Tool for reading, writing, and analyzing files in the codebase'
    );
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['read', 'write', 'list', 'search', 'analyze'],
          description: 'The action to perform'
        },
        path: {
          type: 'string',
          description: 'File or directory path'
        },
        content: {
          type: 'string',
          description: 'Content to write (for write action)'
        },
        pattern: {
          type: 'string',
          description: 'Search pattern (for search action)'
        },
        glob_pattern: {
          type: 'string',
          description: 'Glob pattern for file matching'
        }
      },
      required: ['action']
    };
  }

  async execute(params) {
    this.validate(params);

    switch (params.action) {
      case 'read':
        return await this.readFile(params.path);
      
      case 'write':
        return await this.writeFile(params.path, params.content);
      
      case 'list':
        return await this.listDirectory(params.path);
      
      case 'search':
        return await this.searchFiles(params.pattern, params.path);
      
      case 'analyze':
        return await this.analyzeCodebase(params.path);
      
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }
  }

  async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        path: filePath,
        content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async writeFile(filePath, content) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return {
        success: true,
        path: filePath,
        message: 'File written successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const result = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath, file.name)
      }));
      
      return {
        success: true,
        path: dirPath,
        files: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async searchFiles(pattern, searchPath = '.') {
    return new Promise((resolve) => {
      glob(pattern, { cwd: searchPath }, (err, files) => {
        if (err) {
          resolve({
            success: false,
            error: err.message
          });
        } else {
          resolve({
            success: true,
            pattern,
            matches: files.map(f => path.join(searchPath, f))
          });
        }
      });
    });
  }

  async analyzeCodebase(projectPath) {
    try {
      const analysis = {
        framework: null,
        routes: [],
        components: [],
        structure: {},
        entryPoints: []
      };

      // Check for common framework indicators
      const packageJsonPath = path.join(projectPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        
        // Detect framework
        if (packageJson.dependencies) {
          if (packageJson.dependencies.react || packageJson.dependencies['react-dom']) {
            analysis.framework = 'react';
          } else if (packageJson.dependencies.vue) {
            analysis.framework = 'vue';
          } else if (packageJson.dependencies['@angular/core']) {
            analysis.framework = 'angular';
          } else if (packageJson.dependencies.next) {
            analysis.framework = 'nextjs';
          }
        }

        // Find entry points
        if (packageJson.scripts) {
          analysis.entryPoints = Object.keys(packageJson.scripts);
        }
      } catch (e) {
        // No package.json found
      }

      // Search for routes
      const routePatterns = [
        '**/routes/**/*.{js,jsx,ts,tsx}',
        '**/router/**/*.{js,jsx,ts,tsx}',
        '**/*Routes.{js,jsx,ts,tsx}',
        '**/*Router.{js,jsx,ts,tsx}'
      ];

      for (const pattern of routePatterns) {
        const matches = await this.searchFiles(pattern, projectPath);
        if (matches.success && matches.matches.length > 0) {
          analysis.routes.push(...matches.matches);
        }
      }

      // Search for components
      const componentPatterns = [
        '**/components/**/*.{js,jsx,ts,tsx}',
        '**/pages/**/*.{js,jsx,ts,tsx}',
        '**/views/**/*.{js,jsx,ts,tsx}'
      ];

      for (const pattern of componentPatterns) {
        const matches = await this.searchFiles(pattern, projectPath);
        if (matches.success && matches.matches.length > 0) {
          analysis.components.push(...matches.matches);
        }
      }

      return {
        success: true,
        analysis
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FileSystemTool;