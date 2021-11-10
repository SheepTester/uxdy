# === USAGE ===
# Get cookies from devtools > Application > Cookies > https://act.ucsd.edu
# ruby scrape.rb <jlinksessionidx> <UqZBpD3n>
# stdout has available classes

# Installing Ruby: https://stackoverflow.com/a/37956249

# https://act.ucsd.edu/webreg2/js/webreg/webreg-main.js (I just removed -min) from the URL

require "open-uri"
require "json"

class AuthorizedGetter
  def initialize(session_index, uqz)
    # Instance variables: https://www.rubyguides.com/2019/02/ruby-class/
    @session_index = session_index
    @uqz = uqz
  end

  def get(path, query = {})
    file_name = if query[:subjcode] && query[:subjcode].length > 0
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

CourseUnit = Struct.new :from, :inc, :to do
  def to_s
    "#{from} to #{to} by #{inc}"
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
    if @unit.from > @unit.to
      raise "unit from > unit to"
      # elsif (@unit.from == @unit.to) != (@unit.inc == 0)
      # There is only one exception to this, which is MATH 295: Special Topics
      # in Mathematics (1.0 to 1.0 by 1.0 units)

      # puts self.to_s
      # puts "inc's zeroness is inconsistent with from's equality with to"
      # elsif @unit.from % 1 != 0 || @unit.to % 1 != 0
      #   puts self.to_s
      #   puts "unit from/to not integer"
    end

    @groups = raw_groups.map { |raw_group| Group.new raw_group }
    # for group in @groups
    #   unless group.start_date == @groups[0].start_date && group.end_date == @groups[0].end_date
    #     puts self.to_s
    #     puts @groups[0].to_s
    #     puts group.to_s
    #     raise 'Group start/end dates don\'t match'
    #   end
    # end
  end

  def to_s
    "#{@subject} #{@course}: #{@title} (#{@unit} units)" # + @groups.map { |group| "\n\n#{group}" }.join
  end
end

GroupTime = Struct.new :hours, :minutes do
  def to_s
    "%02d:%02d" % [hours, minutes]
  end
end

def yn_to_bool(yn, empty_allowed = nil)
  case yn
  when "Y" then true
  when "N" then false
  when " "
    if empty_allowed == nil
      raise "Given a space, which is not allowed"
    else
      empty_allowed
    end
  else
    raise "#{yn} is not Y or N"
  end
end

Instructor = Struct.new :name, :pid do
  def to_s
    if pid
      "#{name} (#{pid})"
    else
      name
    end
  end
end

class Group
  attr_reader :start, :end, :days, :start_date, :end_date, :capacity, :enrolled,
              :available, :waitlist, :can_enroll, :code, :group_type,
              :before_description, :description, :building, :room, :instructors,
              :instructor_pid, :section_id, :is_primary_instructor,
              :sst_section_statistic_cd, :print_flag, :instruction_type

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

  # https://registrar.ucsd.edu/StudentLink/instr_codes.html
  @@group_types = {
    "  " => :default, "FI" => :final_exam, "TBA" => :to_be_announced,
    "MI" => :midterm, "MU" => :make_up_session, "RE" => :review_session,
    "PB" => :problem_session, "OT" => :other_additional_meeting,
  }
  @@instruction_types = {
    "DI" => :discussion, "LE" => :lecture, "SE" => :seminar, "PR" => :practicum,
    "IN" => :independent_study, "IT" => :internship, "FW" => :fieldwork,
    "LA" => :lab, "CL" => :clinical_clerkship, "TU" => :tutorial,
    "CO" => :conference, "ST" => :studio, "OP" => :idk,
    "OT" => :other_additional_meeting, "SA" => :what,
  }

  def initialize(raw_group)
    if raw_group.keys != @@keys
      puts raw_group
      raise "Group keys do not meet expectations"
    end

    @start = GroupTime.new(raw_group[:BEGIN_HH_TIME], raw_group[:BEGIN_MM_TIME])
    @end = GroupTime.new(raw_group[:END_HH_TIME], raw_group[:END_MM_TIME])
    # .chars: https://stackoverflow.com/a/37109086
    unless raw_group[:DAY_CODE] == " " || raw_group[:DAY_CODE] =~ /\A[1-7]+\Z/
      puts raw_group
      puts raw_group[:DAY_CODE]
      raise "days has non-1-7s"
    end
    @days = raw_group[:DAY_CODE].strip.chars.map { |day| day.to_i }

    # TODO: Ensure these are the same for all groups
    @start_date = raw_group[:SECTION_START_DATE]
    @end_date = raw_group[:SECTION_END_DATE]

    # TODO: Should these add up? iirc no.
    # 9999 = no limit
    @capacity = raw_group[:SCTN_CPCTY_QTY]
    @enrolled = raw_group[:SCTN_ENRLT_QTY]
    # Should be set to 0 if negative or if @can_enroll is false
    @available = raw_group[:AVAIL_SEAT]
    @waitlist = raw_group[:COUNT_ON_WAITLIST]
    @can_enroll = !yn_to_bool(raw_group[:STP_ENRLT_FLAG])

    @code = raw_group[:SECT_CODE]
    # JAPN 10B goes down to P00
    unless @code =~ /\A[A-P01]\d\d\Z/
      raise "code looks weird '#{@code}'"
    end
    # FM|PB|RE|OT|MU|FI|MI are finals
    @group_type = @@group_types[raw_group[:FK_SPM_SPCL_MTG_CD]] || raise("#{raw_group[:FK_SPM_SPCL_MTG_CD]} is not a group type")
    # "Meeting type"
    @instruction_type = @@instruction_types[raw_group[:FK_CDI_INSTR_TYPE]] || raise("#{raw_group[:FK_CDI_INSTR_TYPE]} is not an instruction type")
    # {""=>11649, "AC"=>260, "NC"=>22}
    @before_description = raw_group[:BEFORE_DESC].strip
    # A few courses have nonempty descriptions but they are mostly useless
    @description = raw_group[:LONG_DESC].strip
    @building = raw_group[:BLDG_CODE].strip
    unless raw_group[:BLDG_CODE].length == 5 || raw_group[:BLDG_CODE] == "TBA"
      raise "'#{raw_group[:BLDG_CODE]}' not 5 chars"
    end
    @room = raw_group[:ROOM_CODE].strip
    unless raw_group[:ROOM_CODE].length == 5 || raw_group[:ROOM_CODE] == "TBA"
      raise "'#{raw_group[:ROOM_CODE]}' not 5 chars"
    end
    # Instructors, split by colons. Each instructor is a name, semicolon, then
    # their PID. An empty string means "Staff."
    @instructors = raw_group[:PERSON_FULL_NAME].strip.split(":").map { |instructor|
      unless instructor == "Staff;" || instructor.split(";")[0].length == 35
        raise "'#{instructor}' not 35 chars"
      end
      Instructor.new(*instructor.split(";").map { |part| part.strip })
    }
    if @instructors.length == 0
      @instructors = [Instructor.new("Staff", nil)]
    end

    # ??
    @section_id = raw_group[:SECTION_NUMBER]
    # {true=>11313, false=>618} (either " " or "Y")
    @is_primary_instructor = yn_to_bool(raw_group[:PRIMARY_INSTR_FLAG], false)
    unless (raw_group[:PERSON_FULL_NAME] == "Staff; ") != @is_primary_instructor
      puts self.to_s
      puts raw_group
      raise "primary instructor-staff mismatch"
    end
    # {"AC"=>9933, "NC"=>1716, "CA"=>282}
    # CA = cancelled
    # AC = graded? "only for graded section (== AC section)"
    @sst_section_statistic_cd = raw_group[:FK_SST_SCTN_STATCD]
    # {" "=>9591, "N"=>75, "Y"=>23, "5"=>2}
    @print_flag = raw_group[:PRINT_FLAG]
  end

  # Webreg seems to group only the sections that are neither finals nor midterms
  # nor A00 into an array cateAX, where A is some letter.
  def is_x_class?
    (@group_type == :default || @group_type == :to_be_announced) &&
      @code[1..3] != "00"
  end

  def display_available
    # HACK: Had to move this out into a separate variable because Solargraph was
    # being pissed:
    # Request textDocument/documentHighlight failed.
    # Message: [NoMethodError] undefined method `+' for nil:NilClass
    # Code: -32603
    location_instructors = "#{@building} #{@room} by #{@instructors.join(", ")}"
    [
      "#{@code} (#{@group_type}): #{@enrolled}/#{if @capacity == 9999 then "∞" else @capacity end} enrolled#{if @available == 9999 then "" else " (#{@available} available)" end}, #{@waitlist} on waitlist (#{if @can_enroll then "Can enroll" else "Can\'t enroll" end})",
      "  #{@start}–#{@end} on #{@days.map { |day| @@day_names[day] }.join ", "} at #{location_instructors}",
      "  " + [@section_id, @before_description, @description, @is_primary_instructor, @spam_special_meeting_cd, @sst_section_statistic_cd, @print_flag].join(" "),
    ].join "\n"
  end

  def to_s
    self.display_available
  end
end

def loop_courses(courses)
  for course in courses
    for group in course.groups
      yield group
    end
  end
end

def get_frequencies(courses, get_property)
  frequencies = {}
  # when Symbol: https://stackoverflow.com/a/4422053
  case get_property
  when Symbol
    key = get_property
    get_property = Proc.new { |group| group.send key }
  end
  loop_courses courses do |group|
    value = get_property.call group
    if not frequencies.has_key? value
      frequencies[value] = 0
    end
    frequencies[value] += 1
  end
  frequencies
end

def display_groups(courses, only_joinable)
  for course in courses
    if only_joinable && course.course.scan(/\d+/)[0].to_i >= 100
      next
    end
    joinable_groups = []
    if only_joinable
      for group in course.groups
        if group.can_enroll && group.available > 0 && group.is_x_class?
          joinable_groups << group
        end
      end
    else
      joinable_groups = course.groups
    end
    if joinable_groups.length > 0
      puts "================"
      puts course
      puts joinable_groups.join "\n"
    end
  end
end

def get_courses(getter)
  # === SET TERM HERE ===
  term = "WI22"

  subjects = getter.get("search-load-subject", { :termcode => term })
  departments = getter.get("search-load-department", { :termcode => term })

  # .read: https://stackoverflow.com/a/5786863
  # JSON.parse, symbolize_names: true: https://stackoverflow.com/questions/5410682/parsing-a-json-string-in-ruby#comment34766758_5410713
  raw_courses = getter.get("search-by-all", {
    :subjcode => "", :crsecode => "", :department => "", :professor => "",
    :title => "", :levels => "", :days => "", :timestr => "",
    :opensection => "false", :isbasic => "true", :basicsearchvalue => "",
    :termcode => term,
  })

  ## Just making sure the structure is proper
  # .each: https://code-maven.com/for-loop-in-ruby
  courses = raw_courses.map do |raw_course|
    raw_groups = getter.get("search-load-group-data", {
      :subjcode => raw_course[:SUBJ_CODE], :crsecode => raw_course[:CRSE_CODE],
      :termcode => term,
    })
    Course.new(raw_course, raw_groups)
  end

  section_ids = courses.flat_map { |course| course.groups.map { |group| group.section_id } }
  puts getter.get("search-get-section-text", {
    :sectnumlist => section_ids[0, 100].join(":"),
    :termcode => term,
  })

  # === LOOK AT COURSES ===
  # puts courses.length
  # puts courses[1000]

  # === INSPECT COURSE FIELDS ===
  # puts get_frequencies courses, :print_flag
  # puts get_frequencies courses, Proc.new { |group| if group.group_type != :default then nil else group.instruction_type end }
  # loop_courses courses do |group|
  #   if group.instructors.length > 1
  #     puts group
  #     # break
  #   end
  # end
  for course in courses
    remote_groups = course.groups.filter_map { |group| group.code if group.building == "RCLAS" }
    if remote_groups.length > 0
      puts "#{course.subject} #{course.course}: #{remote_groups.join(", ")}"
    end
  end

  # === OUTPUT COURSE SUMMARY ===
  # need to pipe into a file
  # true/false: whether to only show joinable courses
  # display_groups(courses, false)
end

# __FILE == $0: https://www.ruby-lang.org/en/documentation/quickstart/4/
if __FILE__ == $0
  # ARGV: https://code-maven.com/argv-the-command-line-arguments-in-ruby
  get_courses(AuthorizedGetter.new(ARGV[0], ARGV[1]))
end
