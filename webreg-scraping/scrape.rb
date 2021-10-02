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
    json
  end
end

class CourseUnit
  attr_reader :from, :inc, :to

  def initialize(from, inc, to)
    @from = from
    @inc = inc
    @to = to
  end

  def to_s
    "#{@from} to #{@to} by #{@inc}"
  end
end

class Course
  attr_reader :subject, :course, :title, :unit, :groups

  @@keys = [
    :UNIT_TO, :SUBJ_CODE, :UNIT_INC, :CRSE_TITLE, :UNIT_FROM, :CRSE_CODE,
  ]

  def initialize(raw_course, raw_groups)
    if raw_course.keys != @@keys
      puts raw_course
      raise "Course keys do not match my expectations."
    end

    @subject = raw_course[:SUBJ_CODE].strip
    @course = raw_course[:CRSE_CODE].strip
    @title = raw_course[:CRSE_TITLE].strip
    @unit = CourseUnit.new(raw_course[:UNIT_FROM], raw_course[:UNIT_INC], raw_course[:UNIT_TO])

    @groups = raw_groups.map { |raw_group| Group.new raw_group }
  end

  def to_s
    "#{@subject} #{@course}: #{@title} (#{@unit} units)" # + @groups.map { |group| "\n\n#{group}" }.join
  end
end

class GroupTime
  attr_reader :hours, :minutes

  def initialize(hours, minutes)
    @hours = hours
    @minutes = minutes
  end

  def to_s
    "%02d:%02d" % [@hours, @minutes]
  end
end

class Group
  attr_reader :start, :end, :days, :start_date, :end_date, :capacity, :enrolled,
              :available, :waitlist, :can_enroll, :code, :group_type,
              :before_description, :description, :building, :room, :instructor,
              :instructor_pid, :section_id, :is_primary_instructor,
              :spam_special_meeting_cd, :sst_section_statistic_cd

  @@keys = [
    :END_MM_TIME, :SCTN_CPCTY_QTY, :LONG_DESC, :SCTN_ENRLT_QTY, :BEGIN_HH_TIME,
    :SECTION_NUMBER, :SECTION_START_DATE, :STP_ENRLT_FLAG, :SECTION_END_DATE,
    :COUNT_ON_WAITLIST, :PRIMARY_INSTR_FLAG, :BEFORE_DESC, :ROOM_CODE,
    :END_HH_TIME, :START_DATE, :DAY_CODE, :BEGIN_MM_TIME, :PERSON_FULL_NAME,
    :FK_SPM_SPCL_MTG_CD, :PRINT_FLAG, :BLDG_CODE, :FK_SST_SCTN_STATCD,
    :FK_CDI_INSTR_TYPE, :SECT_CODE, :AVAIL_SEAT,
  ]
  @@day_names = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ]

  def initialize(raw_group)
    if raw_group.keys != @@keys
      puts raw_group
      raise "Group keys do not meet expectations"
    end

    @start = GroupTime.new(raw_group[:BEGIN_HH_TIME], raw_group[:BEGIN_MM_TIME])
    @end = GroupTime.new(raw_group[:END_HH_TIME], raw_group[:END_MM_TIME])
    # .chars: https://stackoverflow.com/a/37109086
    @days = raw_group[:DAY_CODE].chars.map { |day| day.to_i }

    # TODO: Ensure these are the same for all groups
    @start_date = raw_group[:SECTION_START_DATE]
    @end_date = raw_group[:SECTION_END_DATE]

    # TODO: Should these add up? iirc no.
    @capacity = raw_group[:SCTN_CPCTY_QTY]
    @enrolled = raw_group[:SCTN_ENRLT_QTY]
    @available = raw_group[:AVAIL_SEAT]
    @waitlist = raw_group[:COUNT_ON_WAITLIST]
    @can_enroll = raw_group[:STP_ENRLT_FLAG] == "Y"

    @code = raw_group[:SECT_CODE]
    # {""=>5060, "FI"=>1308, "TBA"=>5157, "MI"=>127, "MU"=>8, "RE"=>11, "PB"=>227, "OT"=>33}
    @group_type = raw_group[:FK_SPM_SPCL_MTG_CD].strip
    # {""=>11649, "AC"=>260, "NC"=>22}
    @before_description = raw_group[:BEFORE_DESC].strip
    # A few courses have nonempty descriptions but they are mostly useless
    @description = raw_group[:LONG_DESC].strip
    @building = raw_group[:BLDG_CODE].strip
    @room = raw_group[:ROOM_CODE].strip
    @instructor, @instructor_pid = raw_group[:PERSON_FULL_NAME].split(";").map { |part| part.strip }

    # ??
    @section_id = raw_group[:SECTION_NUMBER]
    # {true=>11313, false=>618}
    @is_primary_instructor = raw_group[:PRIMARY_INSTR_FLAG] == "Y"
    # {""=>5060, "FI"=>1308, "TBA"=>5157, "MI"=>127, "MU"=>8, "RE"=>11, "PB"=>227, "OT"=>33}
    @spam_special_meeting_cd = raw_group[:FK_SPM_SPCL_MTG_CD].strip
    # {"AC"=>9933, "NC"=>1716, "CA"=>282}
    @sst_section_statistic_cd = raw_group[:FK_SST_SCTN_STATCD]
  end

  def to_s
    [
      "#{@code} (#{@group_type}): #{@enrolled}/#{@capacity} enrolled (#{@available} available), #{@waitlist} on waitlist (#{if @can_enroll then "Can enroll" else "Can\'t enroll" end})",
      "  #{@start}–#{@end} on #{@days.map { |day| @@day_names[day] }.join ", "} at #{@building} #{@room} by #{@instructor} (#{@instructor_pid})",
      "  " + [@before_description, @description, @section_id, @is_primary_instructor, @spam_special_meeting_cd, @sst_section_statistic_cd].join(" "),
    ].join "\n"
  end
end

def get_frequencies(courses, key)
  frequencies = {}
  for course in courses
    for group in course.groups
      value = group.send key
      if not frequencies.has_key? value
        frequencies[value] = 0
      end
      frequencies[value] += 1
    end
  end
  frequencies
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

  ## Just making sure the structure is proper
  # .each: https://code-maven.com/for-loop-in-ruby
  courses = raw_courses.map do |raw_course|
    raw_groups = getter.get("search-load-group-data", {
      :subjcode => raw_course[:SUBJ_CODE], :crsecode => raw_course[:CRSE_CODE],
      :termcode => "FA21",
    })
    Course.new(raw_course, raw_groups)
  end

  puts courses.length
  # puts courses[1000]

  puts get_frequencies courses, :group_type
  puts get_frequencies courses, :before_description

  for course in courses
    if course.course.scan(/\d+/)[0].to_i >= 100
      next
    end
    joinable_groups = []
    for group in course.groups
      if group.can_enroll && group.available > 0
        joinable_groups << group
      end
    end
    if joinable_groups.length > 0
      puts "================"
      puts course
      puts joinable_groups.join "\n"
    end
  end
end

# __FILE == $0: https://www.ruby-lang.org/en/documentation/quickstart/4/
if __FILE__ == $0
  # ARGV: https://code-maven.com/argv-the-command-line-arguments-in-ruby
  get_courses(AuthorizedGetter.new(ARGV[0], ARGV[1]))
end
