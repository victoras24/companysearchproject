import React from "react";

const LegalDisclaimer: React.FC = () => {
	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-4 max-w-4xl">
				<div className="bg-white rounded-xl shadow-lg overflow-hidden">
					<div className="bg-gradient-to-r from-emerald-50 to-cyan-50 px-8 py-6 border-b border-gray-100">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold text-gray-800">
									Legal Disclaimer
								</h1>
								<p className="text-gray-600 mt-2">
									Important information regarding our data sources and accuracy
								</p>
							</div>
						</div>
					</div>

					<div className="px-8 py-8">
						<div className="prose prose-blue max-w-none">
							<section className="mb-10 pb-6 border-b border-gray-100">
								<div className="flex items-start mb-4">
									<div className="bg-red-100 p-3 rounded-lg mr-4">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-6 w-6 text-red-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
											/>
										</svg>
									</div>
									<h2 className="text-xl font-semibold text-gray-800 mt-1">
										Requesting Removal of Company Information
									</h2>
								</div>
								<p className="text-gray-700 mb-3">
									The information presented on Company Search Cyprus is derived
									exclusively from public records maintained by official
									government registries and published government data sources.
								</p>
								<p className="text-gray-700 mb-3">
									We maintain an accurate representation of these public records
									and do not remove company information that is part of the
									public domain. The publication of company data serves
									essential societal functions:
								</p>
								<ul className="list-disc pl-5 text-gray-700 space-y-2 mb-3">
									<li>
										Promoting transparency and fairness in commercial activities
									</li>
									<li>
										Enabling consumers to verify company legitimacy and standing
									</li>
									<li>Providing necessary information for legal proceedings</li>
									<li>
										Supporting informed decision-making in business
										relationships
									</li>
								</ul>
							</section>

							<section className="mb-10 pb-6 border-b border-gray-100">
								<div className="flex items-start mb-4">
									<div className="bg-yellow-100 p-3 rounded-lg mr-4">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-6 w-6 text-yellow-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
									<h2 className="text-xl font-semibold text-gray-800 mt-1">
										Data Currency and Updates
									</h2>
								</div>
								<p className="text-gray-700 mb-3">
									We continuously update our database with new company
									registrations and maintain a rigorous schedule for refreshing
									existing records directly from the official government
									registry.
								</p>
								<p className="text-gray-700 mb-3">
									Despite our efforts to maintain current information, the
									dynamic nature of business registrations means some data may
									temporarily become outdated. We prioritize updates based on:
								</p>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
									<div className="bg-blue-50 p-4 rounded-lg">
										<h3 className="font-medium text-blue-700">
											Standard Update Cycle
										</h3>
										<p className="text-sm text-gray-700">
											All records are updated at least quarterly
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<h3 className="font-medium text-green-700">
											Expedited Updates
										</h3>
										<p className="text-sm text-gray-700">
											Request priority updates for critical records
										</p>
									</div>
								</div>
								<p className="text-gray-700">
									If you encounter outdated information, please contact our
									support team to request expedited processing for specific
									records.
								</p>
							</section>

							<section className="mb-8">
								<div className="flex items-start mb-4">
									<div className="bg-blue-100 p-3 rounded-lg mr-4">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-6 w-6 text-blue-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
											/>
										</svg>
									</div>
									<h2 className="text-xl font-semibold text-gray-800 mt-1">
										Data Accuracy Verification
									</h2>
								</div>
								<p className="text-gray-700 mb-3">
									If you identify information that appears incorrect on our
									platform, we recommend the following verification process:
								</p>
								<ol className="list-decimal pl-5 text-gray-700 space-y-2 mb-4">
									<li>
										<span className="font-medium">
											Confirm with the primary source:
										</span>{" "}
										Check the official government registry through the link
										provided on each company profile page
									</li>
									<li>
										<span className="font-medium">Verify update timing:</span>{" "}
										Note that government registries may have processing delays
										for new filings
									</li>
									<li>
										<span className="font-medium">Report discrepancies:</span>{" "}
										If the official registry contains different information,
										notify us immediately
									</li>
								</ol>
								<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
									<p className="text-gray-700 italic">
										"Company Search Cyprus is committed to data accuracy. When
										notified of verified discrepancies with official sources, we
										prioritize correction within 72 business hours."
									</p>
								</div>
							</section>
						</div>

						<div className="mt-10 pt-6 border-t border-gray-200">
							<h3 className="text-lg font-medium text-gray-800 mb-4">
								Need Further Assistance?
							</h3>
							<div className="flex flex-col sm:flex-row gap-6">
								<div className="flex items-center">
									<div className="bg-gray-100 p-2 rounded-lg mr-3">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5 text-gray-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<div>
										<p className="text-sm text-gray-600">Email support</p>
										<p className="font-medium text-gray-800">
											companysearchcy@gmail.com
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LegalDisclaimer;
