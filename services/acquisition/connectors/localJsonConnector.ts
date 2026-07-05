/**
 * Local JSON Connector
 * 
 * Reads knowledge from local JSON files for testing and development
 */

import * as fs from "fs";
import * as path from "path";
import type { IConnector, ConnectorConfig, ConnectorResult } from "./connector";

export class LocalJsonConnector implements IConnector {
  readonly sourceType = "local-json";

  async connect(config: ConnectorConfig): Promise<ConnectorResult> {
    try {
      if (!this.validateSource(config)) {
        return {
          success: false,
          data: null,
          contentType: "json",
          sourceUrl: config.sourceUrl || "",
          error: "Invalid configuration: missing sourceUrl",
          metadata: {
            retrievedAt: new Date().toISOString(),
            contentType: "application/json",
            size: 0,
          },
        };
      }

      const filePath = config.sourceUrl!;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          data: null,
          contentType: "json",
          sourceUrl: filePath,
          error: `File not found: ${filePath}`,
          metadata: {
            retrievedAt: new Date().toISOString(),
            contentType: "application/json",
            size: 0,
          },
        };
      }

      // Read file
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(fileContent);

      return {
        success: true,
        data: jsonData,
        contentType: "json",
        sourceUrl: filePath,
        error: null,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: "application/json",
          size: fileContent.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        contentType: "json",
        sourceUrl: config.sourceUrl || "",
        error: error.message,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: "application/json",
          size: 0,
        },
      };
    }
  }

  validateSource(config: ConnectorConfig): boolean {
    return !!config.sourceUrl && config.sourceType === "local-json";
  }
}
