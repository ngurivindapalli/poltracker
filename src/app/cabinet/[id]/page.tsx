import { getCabinetMemberById } from "@/lib/cabinetData"
import Tweets from "@/components/Tweets"
import CabinetNews from "@/components/CabinetNews"

export default function CabinetProfile({ params }:any){
  const member = getCabinetMemberById(params.id)

  if(!member){
    return <div className="p-10">Cabinet member not found</div>
  }

  return(
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2">
        {member.name}
      </h1>
      <p className="text-gray-600 mb-2">
        {member.position}
      </p>
      {member.confirmation_vote && (
        <p className="text-gray-500 mt-2">
          {member.confirmation_vote}
        </p>
      )}

      <div className="grid grid-cols-2 gap-10 mt-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Department
          </h2>
          <p>{member.department}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Latest Tweets
          </h2>
          {member.twitter ? (
            <Tweets handle={member.twitter}/>
          ) : (
            <p className="text-gray-500">
              No Twitter account available.
            </p>
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">
          Latest News
        </h2>
        <CabinetNews name={member.name} />
      </div>

      <div className="grid grid-cols-2 gap-10 mt-10">
        <div>
          <h2 className="text-xl font-semibold mb-3">
            Department Budget
          </h2>
          <p>{member.budget}</p>

          <h3 className="text-lg font-semibold mt-6">
            Employees
          </h3>
          <p>{member.employees}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">
            Oversight Committees
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            {member.oversight_committees?.map((c:any)=>(
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">
          Agencies Within Department
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          {member.agencies?.map((a:any)=>(
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">
          Major Federal Contractors
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          {member.major_contractors?.map((c:any)=>(
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">
          Career History
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          {member.career_history?.map((h:any)=>(
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
    </main>
  )
}
