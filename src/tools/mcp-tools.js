const fs = require('fs').promises;
const path = require('path');

/**
 * MCP 工具管理系统
 * 提供基础的文件系统操作工具
 */
class MCPToolManager {
  constructor() {
    this.tools = new Map();
    this.registerBasicTools();
  }

  /**
   * 注册基础工具
   */
  registerBasicTools() {
    // 文件读取工具
    this.registerTool('read_file', {
      description: '读取文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '文件路径'
          }
        },
        required: ['path']
      },
      handler: this.readFile.bind(this)
    });

    // 目录列表工具
    this.registerTool('list_directory', {
      description: '列出目录内容',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '目录路径'
          },
          recursive: {
            type: 'boolean',
            description: '是否递归列出子目录',
            default: false
          }
        },
        required: ['path']
      },
      handler: this.listDirectory.bind(this)
    });

    // 文件搜索工具
    this.registerTool('search_files', {
      description: '搜索文件内容',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: '搜索模式（正则表达式）'
          },
          directory: {
            type: 'string',
            description: '搜索目录'
          },
          fileExtensions: {
            type: 'array',
            items: { type: 'string' },
            description: '文件扩展名过滤'
          }
        },
        required: ['pattern', 'directory']
      },
      handler: this.searchFiles.bind(this)
    });

    // 路由分析工具
    this.registerTool('analyze_routes', {
      description: '分析前端路由配置',
      parameters: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: '项目根目录路径'
          },
          framework: {
            type: 'string',
            description: '前端框架类型 (react, vue, angular)',
            default: 'react'
          }
        },
        required: ['projectPath']
      },
      handler: this.analyzeRoutes.bind(this)
    });
  }

  /**
   * 注册工具
   */
  registerTool(name, tool) {
    this.tools.set(name, tool);
  }

  /**
   * 获取所有工具定义
   */
  getToolDefinitions() {
    const definitions = [];
    for (const [name, tool] of this.tools) {
      definitions.push({
        name,
        description: tool.description,
        parameters: tool.parameters
      });
    }
    return definitions;
  }

  /**
   * 执行工具调用
   */
  async executeTool(name, parameters) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    try {
      return await tool.handler(parameters);
    } catch (error) {
      throw new Error(`Error executing tool '${name}': ${error.message}`);
    }
  }

  /**
   * 读取文件内容
   */
  async readFile({ path: filePath }) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        content,
        size: content.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 列出目录内容
   */
  async listDirectory({ path: dirPath, recursive = false }) {
    try {
      const items = [];
      
      const scanDirectory = async (currentPath, depth = 0) => {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(dirPath, fullPath);
          
          const item = {
            name: entry.name,
            path: relativePath,
            type: entry.isDirectory() ? 'directory' : 'file',
            depth
          };

          if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            item.size = stats.size;
            item.extension = path.extname(entry.name);
          }

          items.push(item);

          if (recursive && entry.isDirectory() && depth < 3) {
            await scanDirectory(fullPath, depth + 1);
          }
        }
      };

      await scanDirectory(dirPath);
      
      return {
        success: true,
        items,
        total: items.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 搜索文件内容
   */
  async searchFiles({ pattern, directory, fileExtensions = [] }) {
    try {
      const results = [];
      const regex = new RegExp(pattern, 'gi');

      const searchInDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            await searchInDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (fileExtensions.length === 0 || fileExtensions.includes(ext)) {
              try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const matches = [...content.matchAll(regex)];
                
                if (matches.length > 0) {
                  results.push({
                    file: path.relative(directory, fullPath),
                    matches: matches.map(match => ({
                      text: match[0],
                      index: match.index,
                      line: content.substring(0, match.index).split('\n').length
                    }))
                  });
                }
              } catch (error) {
                // 忽略无法读取的文件
              }
            }
          }
        }
      };

      await searchInDirectory(directory);

      return {
        success: true,
        results,
        total: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析前端路由配置
   */
  async analyzeRoutes({ projectPath, framework = 'react' }) {
    try {
      const routes = [];
      
      // 根据框架类型分析路由
      switch (framework.toLowerCase()) {
        case 'react':
          await this.analyzeReactRoutes(projectPath, routes);
          break;
        case 'vue':
          await this.analyzeVueRoutes(projectPath, routes);
          break;
        case 'angular':
          await this.analyzeAngularRoutes(projectPath, routes);
          break;
        default:
          throw new Error(`Unsupported framework: ${framework}`);
      }

      return {
        success: true,
        framework,
        routes,
        total: routes.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析 React 路由
   */
  async analyzeReactRoutes(projectPath, routes) {
    const routeFiles = await this.findRouteFiles(projectPath, ['.js', '.jsx', '.ts', '.tsx']);

    for (const file of routeFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativeFilePath = path.relative(projectPath, file);

      // Regex to find <Route path="..." element={<Component />} />
      const routeComponentRegex = /<Route\s+path=["']([^"']+)["']\s+(?:element={([^}]+)})?[^>]*\/?>/g;
      let match;
      while ((match = routeComponentRegex.exec(content)) !== null) {
        const path = match[1];
        const elementContent = match[2];
        let component = 'Unknown';
        let requiresAuth = false;

        if (elementContent) {
          // Try to extract component name
          const componentMatch = elementContent.match(/<(\w+)(?:\s|\/|>)/);
          if (componentMatch) {
            component = componentMatch[1];
          }
          // Check for ProtectedRoute or similar patterns
          if (elementContent.includes('ProtectedRoute') || elementContent.includes('AuthGuard')) {
            requiresAuth = true;
          }
        }

        routes.push({
          path,
          file: relativeFilePath,
          type: 'RouteComponent',
          component,
          requiresAuth,
        });
      }

      // Regex to find route objects in arrays (e.g., in createBrowserRouter or useRoutes)
      // This is a simplified approach and might need AST for full accuracy
      const routeObjectRegex = /{([^}]+)}/g;
      const arrayContentMatches = [...content.matchAll(/(?:createBrowserRouter|useRoutes)\s*\(\s*\[([\s\S]*?)\]/g)];

      for (const arrayMatch of arrayContentMatches) {
        const arrayContent = arrayMatch[1];
        let objMatch;
        while ((objMatch = routeObjectRegex.exec(arrayContent)) !== null) {
          const objContent = objMatch[1];
          const pathMatch = objContent.match(/path:\s*["']([^"']+)["']/);
          const elementMatch = objContent.match(/element:\s*([^,]+)/);
          const childrenMatch = objContent.match(/children:\s*\[([\s\S]*?)\]/);

          if (pathMatch) {
            const path = pathMatch[1];
            let component = 'Unknown';
            let requiresAuth = false;

            if (elementMatch) {
              const elementContent = elementMatch[1];
              const componentNameMatch = elementContent.match(/<(\w+)(?:\s|\/|>)/);
              if (componentNameMatch) {
                component = componentNameMatch[1];
              }
              if (elementContent.includes('ProtectedRoute') || elementContent.includes('AuthGuard')) {
                requiresAuth = true;
              }
            }

            routes.push({
              path,
              file: relativeFilePath,
              type: 'RouteObject',
              component,
              requiresAuth,
            });

            // Handle nested routes (simplified: just look for children array)
            if (childrenMatch) {
              // For now, we'll just note the presence of children.
              // A full implementation would recursively parse these children.
              routes.push({
                path: `${path}/*`, // Indicate nested routes
                file: relativeFilePath,
                type: 'NestedRouteParent',
                component: 'Unknown', // Can't easily determine parent component from here
                requiresAuth: false,
                description: `Contains nested routes: ${childrenMatch[1].substring(0, 50)}...`
              });
            }
          }
        }
      }
    }
  }

  /**
   * 查找路由相关文件
   */
  async findRouteFiles(directory, extensions) {
    const files = [];
    
    const searchFiles = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await searchFiles(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            const fileName = entry.name.toLowerCase();
            if (fileName.includes('route') || fileName.includes('router') || fileName === 'app.js' || fileName === 'app.jsx') {
              files.push(fullPath);
            }
          }
        }
      }
    };

    await searchFiles(directory);
    return files;
  }

  // Vue 和 Angular 路由分析方法可以后续扩展
  async analyzeVueRoutes(projectPath, routes) {
    const routeFiles = await this.findRouteFiles(projectPath, ['.js', '.ts']);

    for (const file of routeFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativeFilePath = path.relative(projectPath, file);

      // Regex to find routes array in Vue Router configuration
      const vueRouteRegex = /routes:\s*\[([\s\S]*?)\]/g;
      let match;
      while ((match = vueRouteRegex.exec(content)) !== null) {
        const routesContent = match[1];
        const singleRouteRegex = /{\s*path:\s*["']([^"]+)["'](?:,\s*name:\s*["']([^"]+)["'])?(?:,\s*component:\s*([^,\n]+))?[^}]*}/g;
        let routeMatch;
        while ((routeMatch = singleRouteRegex.exec(routesContent)) !== null) {
          const path = routeMatch[1];
          const name = routeMatch[2] || 'Unknown';
          const component = routeMatch[3] ? routeMatch[3].trim() : 'Unknown';

          routes.push({
            path,
            file: relativeFilePath,
            type: 'VueRoute',
            name,
            component,
            requiresAuth: content.includes('meta: { requiresAuth: true }') // Simplified check
          });
        }
      }
    }
  }

  async analyzeAngularRoutes(projectPath, routes) {
    const routeFiles = await this.findRouteFiles(projectPath, ['.ts']);

    for (const file of routeFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativeFilePath = path.relative(projectPath, file);

      // Regex to find routes array in Angular Router configuration
      const angularRouteRegex = /const\s+\w+Routes:\s*Routes\s*=\s*\[([\s\S]*?)\];/g;
      let match;
      while ((match = angularRouteRegex.exec(content)) !== null) {
        const routesContent = match[1];
        const singleRouteRegex = /{\s*path:\s*["']([^"']+)["'](?:,\s*component:\s*([^,\n]+))?[^}]*}/g;
        let routeMatch;
        while ((routeMatch = singleRouteRegex.exec(routesContent)) !== null) {
          const path = routeMatch[1];
          const component = routeMatch[2] ? routeMatch[2].trim() : 'Unknown';

          routes.push({
            path,
            file: relativeFilePath,
            type: 'AngularRoute',
            component,
            requiresAuth: content.includes('canActivate: [AuthGuard]') // Simplified check
          });
        }
      }
    }
  }
}

module.exports = MCPToolManager;
