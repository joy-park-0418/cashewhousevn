using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

/// <summary>
/// 가장자리와 연결된 단색 배경 제거 (흰·밝은 회색 / 검정·어두운 회색 모두).
/// 1) Edge flood: 저채도 밝은 영역 또는 저채도 어두운 영역을 테두리에서 채움 → 투명
/// 2) Multi-pass grow: 투명과 맞닿은 할로 제거
///
/// 한계: 배경이 프레임 가장자리와 안 이어지면 제거 불가. 제품과 배경 색이 비슷하면 섞임.
///
/// Recompile:
/// %WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /out:tools\WhiteBgTransparent.exe tools\WhiteBgTransparent.cs /reference:%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\System.Drawing.dll
/// </summary>
class Program
{
    static void GetRgb(byte[] buf, int stride, int w, int h, int x, int y, out byte r, out byte g, out byte b)
    {
        int o = y * stride + x * 4;
        b = buf[o];
        g = buf[o + 1];
        r = buf[o + 2];
    }

    static int Spread(byte r, byte g, byte b)
    {
        return Math.Max(r, Math.Max(g, b)) - Math.Min(r, Math.Min(g, b));
    }

    /// 테두리에서 시작: 밝은 단색(흰·연회) 또는 어두운 단색(검·진회).
    static bool IsEdgeBackground(byte r, byte g, byte b)
    {
        double avg = (r + g + b) / 3.0;
        int sp = Spread(r, g, b);
        bool lightBackdrop = avg >= 200 && sp <= 58;
        bool darkBackdrop = avg <= 58 && sp <= 52;
        return lightBackdrop || darkBackdrop;
    }

    /// 투명 영역 옆으로 한 겹씩: 밝은/어두운 할로 각각 완화된 기준.
    static bool IsGrowBackground(byte r, byte g, byte b)
    {
        double avg = (r + g + b) / 3.0;
        int sp = Spread(r, g, b);
        bool light = avg >= 175 && sp <= 68;
        bool dark = avg <= 85 && sp <= 62;
        return light || dark;
    }

    static void TryEnqueueEdge(byte[] buf, int stride, int w, int h, bool[] mark, Queue<int> q, int x, int y)
    {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        int p = y * w + x;
        if (mark[p]) return;
        byte r, g, b;
        GetRgb(buf, stride, w, h, x, y, out r, out g, out b);
        if (!IsEdgeBackground(r, g, b)) return;
        mark[p] = true;
        q.Enqueue(p);
    }

    static bool NeighborMarked(bool[] mark, int w, int h, int x, int y)
    {
        for (int dy = -1; dy <= 1; dy++)
        {
            for (int dx = -1; dx <= 1; dx++)
            {
                if (dx == 0 && dy == 0) continue;
                int nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                if (mark[ny * w + nx]) return true;
            }
        }
        return false;
    }

    static void GrowBackgroundMask(byte[] buf, int stride, int w, int h, bool[] mark, int passes)
    {
        var next = new bool[w * h];
        for (int pass = 0; pass < passes; pass++)
        {
            Array.Copy(mark, next, mark.Length);
            bool any = false;
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    int p = y * w + x;
                    if (mark[p]) continue;
                    if (!NeighborMarked(mark, w, h, x, y)) continue;
                    byte r, g, b;
                    GetRgb(buf, stride, w, h, x, y, out r, out g, out b);
                    if (!IsGrowBackground(r, g, b)) continue;
                    next[p] = true;
                    any = true;
                }
            }
            if (!any) break;
            Array.Copy(next, mark, mark.Length);
        }
    }

    static void Process(string inputPath, string outputPath)
    {
        string tempPng = Path.Combine(Path.GetTempPath(), "wbgt-" + Guid.NewGuid().ToString("n") + ".png");
        using (var src = new Bitmap(inputPath))
        using (var bmp = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(bmp))
            {
                g.DrawImage(src, 0, 0, src.Width, src.Height);
            }

            var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
            var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = data.Stride;
            int h = bmp.Height;
            int w = bmp.Width;
            int bytes = Math.Abs(stride) * h;
            var buf = new byte[bytes];
            Marshal.Copy(data.Scan0, buf, 0, bytes);

            var mark = new bool[w * h];
            var q = new Queue<int>();

            for (int x = 0; x < w; x++)
            {
                TryEnqueueEdge(buf, stride, w, h, mark, q, x, 0);
                TryEnqueueEdge(buf, stride, w, h, mark, q, x, h - 1);
            }
            for (int y = 0; y < h; y++)
            {
                TryEnqueueEdge(buf, stride, w, h, mark, q, 0, y);
                TryEnqueueEdge(buf, stride, w, h, mark, q, w - 1, y);
            }

            while (q.Count > 0)
            {
                int p = q.Dequeue();
                int x = p % w;
                int y = p / w;
                TryEnqueueEdge(buf, stride, w, h, mark, q, x - 1, y);
                TryEnqueueEdge(buf, stride, w, h, mark, q, x + 1, y);
                TryEnqueueEdge(buf, stride, w, h, mark, q, x, y - 1);
                TryEnqueueEdge(buf, stride, w, h, mark, q, x, y + 1);
            }

            GrowBackgroundMask(buf, stride, w, h, mark, 40);

            for (int p = 0; p < w * h; p++)
            {
                if (!mark[p]) continue;
                int y = p / w;
                int x = p % w;
                int o = y * stride + x * 4;
                buf[o + 3] = 0;
            }

            Marshal.Copy(buf, 0, data.Scan0, bytes);
            bmp.UnlockBits(data);
            bmp.Save(tempPng, ImageFormat.Png);
        }
        File.Copy(tempPng, outputPath, true);
        try { File.Delete(tempPng); } catch { }
    }

    static void Main(string[] args)
    {
        if (args.Length < 1)
        {
            Console.Error.WriteLine("Usage: WhiteBgTransparent.exe <input.png> [output.png]  (removes edge-connected light OR dark solid backdrops)");
            Environment.Exit(1);
            return;
        }
        string input = args[0];
        string output = args.Length >= 2 ? args[1] : input;
        Process(input, output);
        Console.WriteLine("Wrote " + output);
    }
}
