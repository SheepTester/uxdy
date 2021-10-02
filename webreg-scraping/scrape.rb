# Installing Ruby: https://stackoverflow.com/a/37956249

require "open-uri"
require "json"

class AuthorizedGetter
  def initialize(session_index, uqz)
    # Instance variables: https://www.rubyguides.com/2019/02/ruby-class/
    @session_index = session_index
    @uqz = uqz
  end

  def get(path, query = {})
    file_name = if query[:subjcode].length > 0
        "#{path}_#{query[:subjcode].strip}_#{query[:crsecode].strip}"
      else
        path
      end

    begin
      return JSON.parse(File.read("./webreg-data/#{file_name}.json"), symbolize_names: true)
    rescue Errno::ENOENT
    end

    # URI.encode_www_form: https://stackoverflow.com/a/11251654
    json = JSON.parse(URI.open("https://act.ucsd.edu/webreg2/svc/wradapter/secure/#{path}?#{URI.encode_www_form(query)}", {
      # I don't think UqZBpD3n needs to be a secret but whatever
      "Cookie" => "jlinksessionidx=#{@session_index}; UqZBpD3n=#{@uqz}",
    }).read, symbolize_names: true)
    # File.write: https://stackoverflow.com/a/19337403
    File.write("./webreg-data/#{file_name}.json", JSON.pretty_generate(json))
    puts "Fetched #{file_name}"
    return json
  end
end

def get_courses(getter)
  # .read: https://stackoverflow.com/a/5786863
  # JSON.parse, symbolize_names: true: https://stackoverflow.com/questions/5410682/parsing-a-json-string-in-ruby#comment34766758_5410713
  raw_courses = getter.get("search-by-all", {
    :subjcode => "", :crsecode => "", :department => "", :professor => "",
    :title => "", :levels => "", :days => "", :timestr => "",
    :opensection => "false", :isbasic => "true", :basicsearchvalue => "",
    :termcode => "FA21",
  })

  course_keys = [
    :UNIT_TO, :SUBJ_CODE, :UNIT_INC, :CRSE_TITLE, :UNIT_FROM, :CRSE_CODE,
  ]
  group_keys = [
    :END_MM_TIME, :SCTN_CPCTY_QTY, :LONG_DESC, :SCTN_ENRLT_QTY, :BEGIN_HH_TIME,
    :SECTION_NUMBER, :SECTION_START_DATE, :STP_ENRLT_FLAG, :SECTION_END_DATE,
    :COUNT_ON_WAITLIST, :PRIMARY_INSTR_FLAG, :BEFORE_DESC, :ROOM_CODE,
    :END_HH_TIME, :START_DATE, :DAY_CODE, :BEGIN_MM_TIME, :PERSON_FULL_NAME,
    :FK_SPM_SPCL_MTG_CD, :PRINT_FLAG, :BLDG_CODE, :FK_SST_SCTN_STATCD,
    :FK_CDI_INSTR_TYPE, :SECT_CODE, :AVAIL_SEAT,
  ]

  ## Just making sure the structure is proper
  # .each: https://code-maven.com/for-loop-in-ruby
  raw_courses.each do |course|
    # .keys: https://stackoverflow.com/a/8657774
    if course.keys != course_keys
      puts course
      # http://rubylearning.com/satishtalim/ruby_exceptions.html
      raise "Course keys do not match my expectations."
    end

    course_data = getter.get("search-load-group-data", {
      :subjcode => course[:SUBJ_CODE], :crsecode => course[:CRSE_CODE], :termcode => "FA21",
    })
    course_data.each do |group|
      if group.keys != group_keys
        puts group
        raise "Group keys do not meet expectations"
      end
    end
  end

  puts raw_courses.length
end

# __FILE == $0: https://www.ruby-lang.org/en/documentation/quickstart/4/
if __FILE__ == $0
  # ARGV: https://code-maven.com/argv-the-command-line-arguments-in-ruby
  get_courses(AuthorizedGetter.new(ARGV[0], ARGV[1]))
end
