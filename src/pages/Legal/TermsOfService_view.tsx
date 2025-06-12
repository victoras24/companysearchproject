import React from "react";
import { CheckIcon, XIcon, ChevronDownIcon } from "lucide-react";

const TermsOfService: React.FC = () => {
	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-4 max-w-5xl">
				<div className="text-center mb-16">
					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
						Terms of Service
					</h1>
					<p className="text-lg text-gray-600 max-w-3xl mx-auto">
						These terms govern your use of Company Search Cyprus and its
						services.
					</p>
				</div>

				<div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
					<div className="bg-green-50 px-8 py-6 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-800 mb-4">
							Key Terms Summary
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-start">
								<CheckIcon className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
								<p className="text-gray-700">
									You appoint us as your agent to gather company information
									from official sources
								</p>
							</div>
							<div className="flex items-start">
								<CheckIcon className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
								<p className="text-gray-700">
									Service may be modified or discontinued at any time without
									notice
								</p>
							</div>
							<div className="flex items-start">
								<XIcon className="h-5 w-5 text-red-500 mt-1 mr-2 flex-shrink-0" />
								<p className="text-gray-700">
									Do not use our service for illegal activities or to violate
									laws
								</p>
							</div>
							<div className="flex items-start">
								<XIcon className="h-5 w-5 text-red-500 mt-1 mr-2 flex-shrink-0" />
								<p className="text-gray-700">
									Do not reproduce, duplicate, or resell any portion of our
									service
								</p>
							</div>
						</div>
					</div>

					<div className="px-8 py-10">
						<div className="prose prose-blue max-w-none">
							<section className="mb-12">
								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									Overview
								</h2>
								<p className="text-gray-700 mb-4">
									Throughout these Terms of Service, "Service" refers to Company
									Search Cyprus, including all information, tools, and services
									available through this site.
								</p>
								<div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-500">
									<p className="text-gray-700 italic">
										By accessing or using any part of Company Search Cyprus, you
										agree to be bound by these Terms. If you do not agree to all
										terms, you may not access the website or use any services.
									</p>
								</div>
							</section>

							<div className="space-y-8">
								<div className="border border-gray-200 rounded-lg overflow-hidden">
									<button className="flex justify-between items-center w-full p-5 bg-gray-50 text-left">
										<h3 className="text-lg font-semibold text-gray-800">
											Service Terms & User Responsibilities
										</h3>
										<ChevronDownIcon className="h-5 w-5 text-gray-500" />
									</button>
									<div className="p-5">
										<p className="text-gray-700 mb-3">
											By using our Service, you represent that you are at least
											the age of majority in your jurisdiction. You may not use
											our products for any illegal or unauthorized purpose.
										</p>
										<p className="text-gray-700 mb-3">
											We reserve the right to refuse service to anyone for any
											reason at any time. You agree not to reproduce, duplicate,
											copy, sell, or resell any portion of the Service.
										</p>
										<div className="bg-yellow-50 p-4 rounded-lg mt-4">
											<p className="text-gray-700">
												<span className="font-semibold">Important:</span> By
												using Company Search Cyprus, you appoint us as your
												agent to gather information from the Official Cyprus
												Registry and other sources in exchange for a fee.
											</p>
										</div>
									</div>
								</div>

								<div className="border border-gray-200 rounded-lg overflow-hidden">
									<button className="flex justify-between items-center w-full p-5 bg-gray-50 text-left">
										<h3 className="text-lg font-semibold text-gray-800">
											Information Accuracy & Limitations
										</h3>
										<ChevronDownIcon className="h-5 w-5 text-gray-500" />
									</button>
									<div className="p-5">
										<p className="text-gray-700 mb-3">
											We are not responsible if information on this site is
											inaccurate, incomplete, or not current. Free material is
											provided for general information only and should not be
											your sole basis for decisions.
										</p>
										<p className="text-gray-700 mb-3">
											Any report purchased is only accurate on the day of
											purchase. Historical information is provided for reference
											only and is not current.
										</p>
										<div className="flex items-start mt-4">
											<div className="bg-red-100 p-2 rounded-full mr-3">
												<XIcon className="h-4 w-4 text-red-600" />
											</div>
											<p className="text-gray-700">
												We do not warrant that any products, services, or
												information will meet your expectations, or that errors
												will be corrected.
											</p>
										</div>
									</div>
								</div>

								<div className="border border-gray-200 rounded-lg overflow-hidden">
									<button className="flex justify-between items-center w-full p-5 bg-gray-50 text-left">
										<h3 className="text-lg font-semibold text-gray-800">
											Service Modifications & Pricing
										</h3>
										<ChevronDownIcon className="h-5 w-5 text-gray-500" />
									</button>
									<div className="p-5">
										<p className="text-gray-700 mb-3">
											Prices for our products are subject to change without
											notice. We reserve the right to modify or discontinue the
											Service (or any part) without notice at any time.
										</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
											<div className="border p-4 rounded-lg">
												<h4 className="font-semibold text-gray-800 mb-2">
													Our Rights
												</h4>
												<ul className="list-disc pl-5 space-y-1 text-gray-700">
													<li>Change prices without notice</li>
													<li>Modify or discontinue services</li>
													<li>Limit sales to any person or region</li>
													<li>Discontinue any product at any time</li>
												</ul>
											</div>
											<div className="border p-4 rounded-lg">
												<h4 className="font-semibold text-gray-800 mb-2">
													Your Responsibilities
												</h4>
												<ul className="list-disc pl-5 space-y-1 text-gray-700">
													<li>Provide accurate account information</li>
													<li>Promptly update your details</li>
													<li>Monitor changes to our site</li>
													<li>Review billing information carefully</li>
												</ul>
											</div>
										</div>
									</div>
								</div>

								<div className="border border-gray-200 rounded-lg overflow-hidden">
									<button className="flex justify-between items-center w-full p-5 bg-gray-50 text-left">
										<h3 className="text-lg font-semibold text-gray-800">
											Prohibited Activities & Liability
										</h3>
										<ChevronDownIcon className="h-5 w-5 text-gray-500" />
									</button>
									<div className="p-5">
										<p className="text-gray-700 mb-3">
											You are prohibited from using the site for any unlawful
											purpose, to violate laws, infringe on intellectual
											property rights, harass others, submit false information,
											or transmit malicious code.
										</p>

										<div className="mt-6">
											<h4 className="font-semibold text-gray-800 mb-3">
												Limitation of Liability
											</h4>
											<p className="text-gray-700 mb-3">
												We do not guarantee that your use of our service will be
												uninterrupted, timely, secure, or error-free. Your use
												of the service is at your sole risk.
											</p>
											<div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
												<p className="text-gray-700">
													In no case shall Company Search Cyprus be liable for
													any direct, indirect, incidental, punitive, special,
													or consequential damages arising from your use of the
													service.
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="grid gap-8 mt-12">
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-lg font-semibold text-gray-800 mb-3">
										Governing Law & Changes
									</h3>
									<p className="text-gray-700 mb-2">
										These Terms shall be governed by the laws of the Republic of
										Cyprus. We reserve the right to update or replace any part
										of these Terms by posting changes.
									</p>
									<p className="text-gray-700">
										Your continued use after changes constitutes acceptance.
										It's your responsibility to check this page periodically for
										updates.
									</p>
								</div>
							</div>
							<div className="mt-12 pt-8 border-t border-gray-200">
								<div className="flex flex-col md:flex-row justify-between items-center gap-6">
									<div>
										<h3 className="text-lg font-semibold text-gray-800 mb-2">
											Acceptance of Terms
										</h3>
										<p className="text-gray-700">
											By using Company Search Cyprus, you acknowledge that you
											have read, understood, and agree to be bound by these
											Terms of Service.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="text-center mt-12">
					<p className="text-gray-500 text-sm">
						© 2025 Company Search Cyprus. All rights reserved. Operated by
						Company Search Cyprus
					</p>
				</div>
			</div>
		</div>
	);
};

export default TermsOfService;
