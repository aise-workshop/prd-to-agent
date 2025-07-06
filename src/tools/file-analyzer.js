const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const config = require('../config');

class FileAnalyzer {
  constructor() {
    this.supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue'];
  }

  async listFiles(projectPath, patterns = []) {
    const files = [];
    const defaultPatterns = [
      '**/*.{js,jsx,ts,tsx,vue}',
      '!node_modules/**',
      '!dist/**',
      '!build/**',
      '!coverage/**'
    ];

    const searchPatterns = patterns.length > 0 ? patterns : defaultPatterns;

    for (const pattern of searchPatterns) {
      const matches = glob.sync(pattern, { cwd: projectPath });
      files.push(...matches.map(file => path.join(projectPath, file)));
    }

    return [...new Set(files)];
  }

  async readCode(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      const extension = path.extname(filePath);
      
      return {
        path: relativePath,
        content,
        extension,
        size: content.length,
        lines: content.split('\n').length
      };
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  async analyzeRoutes(projectPath) {
    const framework = await this.detectFramework(projectPath);
    const routePatterns = config.frameworks[framework]?.routeFiles || [];
    const routes = [];

    for (const pattern of routePatterns) {
      const files = glob.sync(pattern, { cwd: projectPath });
      
      for (const file of files) {
        const filePath = path.join(projectPath, file);
        const codeInfo = await this.readCode(filePath);
        const extractedRoutes = this.extractRoutesFromCode(codeInfo.content, framework);
        
        routes.push(...extractedRoutes.map(route => ({
          ...route,
          sourceFile: codeInfo.path
        })));
      }
    }

    return routes;
  }

  async extractComponents(projectPath) {
    const framework = await this.detectFramework(projectPath);
    const componentPatterns = config.frameworks[framework]?.componentFiles || [];
    const components = [];

    for (const pattern of componentPatterns) {
      const files = glob.sync(pattern, { cwd: projectPath });
      
      for (const file of files) {
        const filePath = path.join(projectPath, file);
        const codeInfo = await this.readCode(filePath);
        const extractedComponents = this.extractComponentsFromCode(codeInfo.content, framework);
        
        components.push(...extractedComponents.map(component => ({
          ...component,
          sourceFile: codeInfo.path
        })));
      }
    }

    return components;
  }

  async detectFramework(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (dependencies.react || dependencies['@types/react']) {
        return 'react';
      }
      if (dependencies.vue || dependencies['@vue/cli-service']) {
        return 'vue';
      }
      if (dependencies['@angular/core']) {
        return 'angular';
      }
    }

    return 'react';
  }

  extractRoutesFromCode(code, framework) {
    const routes = [];

    switch (framework) {
      case 'react':
        routes.push(...this.extractReactRoutes(code));
        break;
      case 'vue':
        routes.push(...this.extractVueRoutes(code));
        break;
      case 'angular':
        routes.push(...this.extractAngularRoutes(code));
        break;
    }

    return routes;
  }

  extractReactRoutes(code) {
    const routes = [];
    
    // Extract React Router routes
    const routeRegex = /<Route\s+path=["']([^"']+)["'](?:\s+component=\{([^}]+)\})?/g;
    let match;
    
    while ((match = routeRegex.exec(code)) !== null) {
      routes.push({
        path: match[1],
        component: match[2] || 'Unknown',
        requiresAuth: code.includes('ProtectedRoute') || code.includes('RequireAuth')
      });
    }

    return routes;
  }

  extractVueRoutes(code) {
    const routes = [];
    
    // Extract Vue Router routes
    const routeRegex = /{\s*path:\s*['"]([^'"]+)['"],\s*(?:name:\s*['"]([^'"]+)['"],\s*)?component:\s*([^,}]+)/g;
    let match;
    
    while ((match = routeRegex.exec(code)) !== null) {
      routes.push({
        path: match[1],
        name: match[2] || 'Unknown',
        component: match[3] || 'Unknown',
        requiresAuth: code.includes('requiresAuth') || code.includes('meta: { requiresAuth')
      });
    }

    return routes;
  }

  extractAngularRoutes(code) {
    const routes = [];
    
    // Extract Angular routes
    const routeRegex = /{\s*path:\s*['"]([^'"]+)['"],\s*component:\s*([^,}]+)/g;
    let match;
    
    while ((match = routeRegex.exec(code)) !== null) {
      routes.push({
        path: match[1],
        component: match[2] || 'Unknown',
        requiresAuth: code.includes('canActivate') || code.includes('AuthGuard')
      });
    }

    return routes;
  }

  extractComponentsFromCode(code, framework) {
    const components = [];

    switch (framework) {
      case 'react':
        components.push(...this.extractReactComponents(code));
        break;
      case 'vue':
        components.push(...this.extractVueComponents(code));
        break;
      case 'angular':
        components.push(...this.extractAngularComponents(code));
        break;
    }

    return components;
  }

  extractReactComponents(code) {
    const components = [];
    
    // Extract React component names and potential selectors
    const componentRegex = /(?:export\s+default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]+)|class\s+([A-Z][a-zA-Z0-9]+)/g;
    const selectorRegex = /(?:id|className)=["']([^"']+)["']/g;
    
    let match;
    while ((match = componentRegex.exec(code)) !== null) {
      const componentName = match[1] || match[2];
      const selectors = [];
      
      let selectorMatch;
      while ((selectorMatch = selectorRegex.exec(code)) !== null) {
        const selector = selectorMatch[1];
        if (selector.includes(' ')) {
          selectors.push(`.${selector.split(' ')[0]}`);
        } else {
          selectors.push(selector.startsWith('#') ? selector : `#${selector}`);
        }
      }
      
      components.push({
        name: componentName,
        selectors: [...new Set(selectors)]
      });
    }

    return components;
  }

  extractVueComponents(code) {
    const components = [];
    
    // Extract Vue component name and selectors
    const nameRegex = /name:\s*['"]([^'"]+)['"]/;
    const selectorRegex = /(?:id|class)=["']([^"']+)["']/g;
    
    const nameMatch = nameRegex.exec(code);
    const componentName = nameMatch ? nameMatch[1] : 'Unknown';
    
    const selectors = [];
    let selectorMatch;
    while ((selectorMatch = selectorRegex.exec(code)) !== null) {
      const selector = selectorMatch[1];
      selectors.push(selector.startsWith('#') ? selector : `#${selector}`);
    }
    
    components.push({
      name: componentName,
      selectors: [...new Set(selectors)]
    });

    return components;
  }

  extractAngularComponents(code) {
    const components = [];
    
    // Extract Angular component
    const componentRegex = /@Component\s*\(\s*{[\s\S]*?}\s*\)\s*export\s+class\s+([A-Z][a-zA-Z0-9]+)/;
    const selectorRegex = /(?:id|class)=["']([^"']+)["']/g;
    
    const componentMatch = componentRegex.exec(code);
    if (componentMatch) {
      const componentName = componentMatch[1];
      const selectors = [];
      
      let selectorMatch;
      while ((selectorMatch = selectorRegex.exec(code)) !== null) {
        const selector = selectorMatch[1];
        selectors.push(selector.startsWith('#') ? selector : `#${selector}`);
      }
      
      components.push({
        name: componentName,
        selectors: [...new Set(selectors)]
      });
    }

    return components;
  }
}

module.exports = FileAnalyzer;