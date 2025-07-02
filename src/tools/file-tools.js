import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class FileTools {
  static async listFiles(directory, pattern = '**/*') {
    try {
      const files = await glob(pattern, { 
        cwd: directory,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      return files;
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  static async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  static async writeFile(filePath, content) {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  static async findRouteFiles(directory) {
    try {
      const patterns = [
        '**/routes/**/*.{js,ts,jsx,tsx}',
        '**/router/**/*.{js,ts,jsx,tsx}',
        '**/pages/**/*.{js,ts,jsx,tsx}',
        '**/*route*.{js,ts,jsx,tsx}',
        '**/*router*.{js,ts,jsx,tsx}',
        '**/App.{js,ts,jsx,tsx}',
        '**/main.{js,ts,jsx,tsx}',
        '**/index.{js,ts,jsx,tsx}'
      ];
      
      const routeFiles = [];
      for (const pattern of patterns) {
        const files = await glob(pattern, { 
          cwd: directory,
          ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
        });
        routeFiles.push(...files);
      }
      
      return [...new Set(routeFiles)];
    } catch (error) {
      throw new Error(`Failed to find route files: ${error.message}`);
    }
  }

  static async analyzeProject(directory) {
    try {
      const packageJsonPath = path.join(directory, 'package.json');
      let packageJson = null;
      
      if (await fs.pathExists(packageJsonPath)) {
        packageJson = JSON.parse(await this.readFile(packageJsonPath));
      }

      const routeFiles = await this.findRouteFiles(directory);
      const allFiles = await this.listFiles(directory, '**/*.{js,ts,jsx,tsx,vue}');
      
      return {
        packageJson,
        routeFiles,
        allFiles: allFiles.slice(0, 50), // Limit to first 50 files
        framework: this.detectFramework(packageJson)
      };
    } catch (error) {
      throw new Error(`Failed to analyze project: ${error.message}`);
    }
  }

  static detectFramework(packageJson) {
    if (!packageJson || !packageJson.dependencies) return 'unknown';
    
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.react) return 'react';
    if (deps.vue) return 'vue';
    if (deps.angular || deps['@angular/core']) return 'angular';
    if (deps.svelte) return 'svelte';
    if (deps.next) return 'nextjs';
    if (deps.nuxt) return 'nuxtjs';
    
    return 'unknown';
  }
}