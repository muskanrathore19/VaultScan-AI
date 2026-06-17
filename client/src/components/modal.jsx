import React from "react";

const RepoFindingsModal = ({ repoData, loading, onClose, repoName }) => {
  if (!repoData) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-[#0f172a] p-6 rounded-xl w-[85%] max-h-[85%] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Findings for: {repoName}
          </h2>

          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          repoData.map(scan => (
            <div key={scan.scanId} className="mb-6">

              <h3 className="text-sm text-gray-400 mb-2">
                Scan ID: {scan.scanId} ({scan.findings.length} issues)
              </h3>

              <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                <thead>
                  <tr className="text-left bg-white/5">
                    <th className="p-2">File</th>
                    <th className="p-2">Line</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Risk</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {scan.findings.map((f, i) => (
                    <tr key={i} className="border-t border-white/5">

                      <td className="p-2">{f.file}</td>

                      <td className="p-2">
                        {f.line || "N/A"}
                      </td>

                      <td className="p-2">{f.secretType}</td>

                      <td className={`p-2 font-medium ${f.risk === "Critical" ? "text-red-500" :
                          f.risk === "High" ? "text-orange-400" :
                            f.risk === "Medium" ? "text-yellow-400" :
                              "text-green-400"
                        }`}>
                        {f.risk}
                      </td>

                      <td className="p-2">{f.status}</td>

                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default RepoFindingsModal;