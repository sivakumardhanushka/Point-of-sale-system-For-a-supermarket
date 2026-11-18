using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace SupermarketPOS
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string projectDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                string electronExe = Path.Combine(projectDir, "node_modules", "electron", "dist", "electron.exe");
                string mainScript = Path.Combine(projectDir, "electron", "main.cjs");
                string distIndex = Path.Combine(projectDir, "dist", "index.html");
                string srcDir = Path.Combine(projectDir, "src");

                // Check if dist/index.html does not exist or if any source file is newer
                bool needsBuild = !File.Exists(distIndex);
                if (!needsBuild && Directory.Exists(srcDir))
                {
                    DateTime distTime = File.GetLastWriteTimeUtc(distIndex);
                    
                    // Check all files in src/
                    string[] srcFiles = Directory.GetFiles(srcDir, "*.*", SearchOption.AllDirectories);
                    foreach (string file in srcFiles)
                    {
                        if (File.GetLastWriteTimeUtc(file) > distTime)
                        {
                            needsBuild = true;
                            break;
                        }
                    }

                    // Check top-level config files
                    if (!needsBuild)
                    {
                        string[] rootConfigs = { "index.html", "vite.config.js", "package.json" };
                        foreach (string cfg in rootConfigs)
                        {
                            string fullCfg = Path.Combine(projectDir, cfg);
                            if (File.Exists(fullCfg) && File.GetLastWriteTimeUtc(fullCfg) > distTime)
                            {
                                needsBuild = true;
                                break;
                            }
                        }
                    }
                }

                if (needsBuild)
                {
                    ProcessStartInfo buildInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c npm run build",
                        WorkingDirectory = projectDir,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden,
                        UseShellExecute = false
                    };
                    Process buildProc = Process.Start(buildInfo);
                    if (buildProc != null)
                    {
                        buildProc.WaitForExit(60000);
                    }
                }

                // Launch native Electron directly
                ProcessStartInfo startInfo = new ProcessStartInfo();

                if (File.Exists(electronExe))
                {
                    startInfo.FileName = electronExe;
                    startInfo.Arguments = "\"" + mainScript + "\"";
                }
                else
                {
                    startInfo.FileName = "cmd.exe";
                    startInfo.Arguments = "/c npm run desktop";
                }

                startInfo.WorkingDirectory = projectDir;
                startInfo.CreateNoWindow = true;
                startInfo.WindowStyle = ProcessWindowStyle.Hidden;
                startInfo.UseShellExecute = false;

                Process.Start(startInfo);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to launch Supermarket POS:\n" + ex.Message, "Supermarket POS", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
